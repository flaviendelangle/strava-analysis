import { and, asc, count, eq, gt, inArray, sql } from "drizzle-orm";
import strava from "strava-v3";

import { POWER_BEST_ACTIVITY_TYPES } from "../../src/utils/constants";
import type { Database } from "../db";
import {
  activities,
  activityStreams,
  riderSettings,
  syncJobs,
} from "../db/schema";
import {
  calculateHRSS,
  calculateTSS,
  computePowerBests,
  resolveRiderSettings,
} from "./computeScores";
import type { normalizeStreams } from "./strava";
import {
  fetchStreamsFromStrava,
  getAccessToken,
  getModelFromStravaActivity,
} from "./strava";

const PAGE_SIZE = 50;
const BATCH_SIZE = 50;
const STREAM_FETCH_CONCURRENCY = 3;

/**
 * Fire-and-forget sync orchestration.
 * Runs all three phases sequentially, updating the syncJobs row at each step.
 */
export async function runSyncInBackground(
  db: Database,
  athleteId: number,
  syncJobId: number,
) {
  try {
    await syncActivitiesPhase(db, athleteId, syncJobId);
    await syncStreamsPhase(db, athleteId, syncJobId);
    await computeScoresPhase(db, athleteId, syncJobId);
  } catch (error) {
    console.error("[sync] Fatal error:", error);
    await db
      .update(syncJobs)
      .set({
        status: "failed",
        lastError: error instanceof Error ? error.message : String(error),
      })
      .where(eq(syncJobs.id, syncJobId));
  }
}

// ── Phase 1: Fetch activities from Strava ─────────────────────────────

async function syncActivitiesPhase(
  db: Database,
  athleteId: number,
  syncJobId: number,
) {
  const accessToken = await getAccessToken(db, athleteId);

  let page = 1;
  let totalInserted = 0;

  // Page through activities from newest to oldest (Strava's default sort).
  // No `after` parameter — we scan for gaps left by missed webhook events.
  // Stop when a full page yields 0 new inserts (we've caught up).
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Check if job is still active
    const job = await db.query.syncJobs.findFirst({
      where: eq(syncJobs.id, syncJobId),
    });
    if (!job || job.status !== "fetching_activities") return;

    const pageActivities = await strava.athlete.listActivities({
      access_token: accessToken,
      per_page: PAGE_SIZE,
      page,
    });

    if (pageActivities.length === 0) break;

    const models = pageActivities.map((raw) => ({
      ...getModelFromStravaActivity(raw),
      areStreamsLoaded: false,
    }));

    await db
      .insert(activities)
      .values(models)
      .onConflictDoUpdate({
        target: activities.stravaId,
        set: { mapPolyline: sql`excluded.map_polyline` },
      });

    totalInserted += pageActivities.length;

    await db
      .update(syncJobs)
      .set({ activitiesFetched: totalInserted })
      .where(eq(syncJobs.id, syncJobId));

    // Last page of history (fewer than PAGE_SIZE results)
    if (pageActivities.length < PAGE_SIZE) break;

    page++;
    await delay(5_000);
  }

  // Transition to streams phase
  const [{ total }] = await db
    .select({ total: count() })
    .from(activities)
    .where(
      and(
        eq(activities.athlete, athleteId),
        eq(activities.areStreamsLoaded, false),
      ),
    );

  await db
    .update(syncJobs)
    .set({
      activitiesPagesComplete: true,
      status: total > 0 ? "fetching_streams" : "computing_scores",
      streamsTotal: total,
    })
    .where(eq(syncJobs.id, syncJobId));
}

// ── Phase 2: Fetch streams from Strava ────────────────────────────────

async function syncStreamsPhase(
  db: Database,
  athleteId: number,
  syncJobId: number,
) {
  let totalFetched = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const job = await db.query.syncJobs.findFirst({
      where: eq(syncJobs.id, syncJobId),
    });
    if (!job || job.status !== "fetching_streams") return;

    const accessToken = await getAccessToken(db, athleteId);

    const batch = await db
      .select({ id: activities.id, stravaId: activities.stravaId })
      .from(activities)
      .where(
        and(
          eq(activities.athlete, athleteId),
          eq(activities.areStreamsLoaded, false),
        ),
      )
      .limit(10);

    if (batch.length === 0) {
      // Transition to score computation
      await db
        .update(syncJobs)
        .set({ status: "computing_scores" })
        .where(eq(syncJobs.id, syncJobId));
      return;
    }

    // Fetch streams concurrently with limited parallelism to respect Strava rate limits
    const results = await runWithConcurrency(
      batch,
      async (activity) => {
        try {
          const normalized = await fetchStreamsFromStrava(
            accessToken,
            activity.stravaId,
          );
          await storeStreams(db, activity.id, normalized);
          return true;
        } catch (e) {
          console.error(
            `[syncStreamsPhase] Failed for activity ${activity.stravaId}:`,
            e,
          );
          // Mark as loaded so we don't retry forever
          await db
            .update(activities)
            .set({ areStreamsLoaded: true })
            .where(eq(activities.id, activity.id));
          return false;
        }
      },
      STREAM_FETCH_CONCURRENCY,
    );
    totalFetched += results.filter(Boolean).length;

    await db
      .update(syncJobs)
      .set({ streamsFetched: totalFetched })
      .where(eq(syncJobs.id, syncJobId));
  }
}

// ── Phase 3: Compute scores ───────────────────────────────────────────

async function computeScoresPhase(
  db: Database,
  athleteId: number,
  syncJobId: number,
) {
  const job = await db.query.syncJobs.findFirst({
    where: eq(syncJobs.id, syncJobId),
  });
  if (!job || job.status !== "computing_scores") return;

  const settingsDoc = await db.query.riderSettings.findFirst({
    where: eq(riderSettings.athlete, athleteId),
  });

  if (!settingsDoc) {
    await db
      .update(syncJobs)
      .set({ status: "completed" })
      .where(eq(syncJobs.id, syncJobId));
    return;
  }

  let cursor: string | undefined;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await db
      .select()
      .from(activities)
      .where(
        cursor
          ? and(
              eq(activities.athlete, athleteId),
              gt(activities.startDate, cursor),
            )
          : eq(activities.athlete, athleteId),
      )
      .orderBy(asc(activities.startDate))
      .limit(BATCH_SIZE);

    if (batch.length === 0) break;

    await computeActivityScoresBatch(db, batch, settingsDoc);

    cursor = batch[batch.length - 1].startDate;
    if (batch.length < BATCH_SIZE) break;
  }

  await db
    .update(syncJobs)
    .set({ status: "completed" })
    .where(eq(syncJobs.id, syncJobId));
}

// ── Helpers ───────────────────────────────────────────────────────────

export async function storeStreams(
  db: Database,
  activityId: number,
  streams: ReturnType<typeof normalizeStreams>,
) {
  // Delete any existing streams for this activity
  await db
    .delete(activityStreams)
    .where(eq(activityStreams.activityId, activityId));

  if (streams.length > 0) {
    await db.insert(activityStreams).values(
      streams.map((stream) => ({
        activityId,
        type: stream.type,
        seriesType: stream.seriesType,
        originalSize: stream.originalSize,
        resolution: stream.resolution,
        data: JSON.stringify(stream.data),
      })),
    );
  }

  await db
    .update(activities)
    .set({ areStreamsLoaded: true })
    .where(eq(activities.id, activityId));
}

type ActivityForScoring = {
  id: number;
  athlete: number;
  type: string;
  startDateLocal: string;
  weightedAverageWatts: number | null;
  areStreamsLoaded: boolean;
  movingTime: number;
};

type SettingsDocForScoring = {
  initialValues: {
    ftp: number;
    weightKg: number;
    restingHr: number;
    maxHr: number;
    lthr: number;
  };
  changes: {
    date: string;
    ftp?: number;
    weightKg?: number;
    restingHr?: number;
    maxHr?: number;
    lthr?: number;
  }[];
};

type StreamDoc = {
  activityId: number;
  type: string;
  data: string;
  chunkIndex: number | null;
};

/**
 * Batch-compute scores for a set of activities.
 * Pre-loads all required streams in a single query to avoid N+1.
 */
async function computeActivityScoresBatch(
  db: Database,
  batch: ActivityForScoring[],
  settingsDoc: SettingsDocForScoring,
) {
  // Batch-load all streams for activities that have them
  const activitiesWithStreams = batch.filter((a) => a.areStreamsLoaded);
  let streamsMap = new Map<number, StreamDoc[]>();

  if (activitiesWithStreams.length > 0) {
    const allStreams = await db
      .select()
      .from(activityStreams)
      .where(
        and(
          inArray(
            activityStreams.activityId,
            activitiesWithStreams.map((a) => a.id),
          ),
          inArray(activityStreams.type, ["heartrate", "watts"]),
        ),
      );

    streamsMap = new Map<number, StreamDoc[]>();
    for (const stream of allStreams) {
      const existing = streamsMap.get(stream.activityId) ?? [];
      existing.push(stream);
      streamsMap.set(stream.activityId, existing);
    }
  }

  // Compute scores in parallel (CPU-bound, no external API calls)
  await Promise.all(
    batch.map((activity) =>
      computeActivityScoresInternal(
        db,
        activity,
        settingsDoc,
        streamsMap.get(activity.id) ?? [],
      ),
    ),
  );
}

export async function computeActivityScoresInternal(
  db: Database,
  activity: ActivityForScoring,
  settingsDoc: SettingsDocForScoring,
  preloadedStreams?: StreamDoc[],
) {
  const activityDate = activity.startDateLocal.slice(0, 10);
  const settings = resolveRiderSettings(settingsDoc, activityDate);

  const patch: {
    tss?: number;
    hrss?: number;
    powerBests?: Record<number, number> | null;
  } = {};

  if (
    activity.weightedAverageWatts != null &&
    POWER_BEST_ACTIVITY_TYPES.includes(activity.type)
  ) {
    patch.tss = Math.round(
      calculateTSS(
        activity.weightedAverageWatts,
        activity.movingTime,
        settings.ftp,
      ),
    );
  }

  if (activity.areStreamsLoaded) {
    // Use pre-loaded streams if available, otherwise query (for standalone calls)
    const streamDocs =
      preloadedStreams ??
      (await db
        .select()
        .from(activityStreams)
        .where(
          and(
            eq(activityStreams.activityId, activity.id),
            inArray(activityStreams.type, ["heartrate", "watts"]),
          ),
        ));

    const hrDocs = streamDocs
      .filter((s) => s.type === "heartrate")
      .sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));

    if (hrDocs.length > 0) {
      const hrData: number[] = [];
      for (const doc of hrDocs) {
        hrData.push(...(JSON.parse(doc.data) as number[]));
      }
      patch.hrss = Math.round(calculateHRSS(hrData, settings));
    }

    if (POWER_BEST_ACTIVITY_TYPES.includes(activity.type)) {
      const wattsDocs = streamDocs
        .filter((s) => s.type === "watts")
        .sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));

      if (wattsDocs.length > 0) {
        const wattsData: number[] = [];
        for (const doc of wattsDocs) {
          wattsData.push(...(JSON.parse(doc.data) as number[]));
        }
        patch.powerBests = computePowerBests(wattsData);
      }
    } else {
      patch.powerBests = null;
    }
  }

  if (Object.keys(patch).length > 0) {
    await db
      .update(activities)
      .set(patch)
      .where(eq(activities.id, activity.id));
  }
}

export async function recomputeAllScores(db: Database, athleteId: number) {
  const settingsDoc = await db.query.riderSettings.findFirst({
    where: eq(riderSettings.athlete, athleteId),
  });

  if (!settingsDoc) return;

  let cursor: string | undefined;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await db
      .select()
      .from(activities)
      .where(
        cursor
          ? and(
              eq(activities.athlete, athleteId),
              gt(activities.startDate, cursor),
            )
          : eq(activities.athlete, athleteId),
      )
      .orderBy(asc(activities.startDate))
      .limit(BATCH_SIZE);

    if (batch.length === 0) break;

    await computeActivityScoresBatch(db, batch, settingsDoc);

    cursor = batch[batch.length - 1].startDate;
    if (batch.length < BATCH_SIZE) break;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Run async tasks with limited concurrency. */
async function runWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}
