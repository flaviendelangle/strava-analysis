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

export type SyncMode = "load_new" | "load_missing" | "reload_all" | "recompute_scores";

/**
 * Fire-and-forget sync orchestration.
 * Runs phases sequentially based on mode, updating the syncJobs row at each step.
 */
export async function runSyncInBackground(
  db: Database,
  athleteId: number,
  syncJobId: number,
  mode: SyncMode,
  afterEpoch?: number,
) {
  try {
    if (mode !== "recompute_scores") {
      const options: SyncActivitiesOptions = {};
      if (mode === "load_new" && afterEpoch != null) {
        options.after = afterEpoch;
      }
      if (mode === "load_missing") {
        options.detectUpdates = true;
      }

      await syncActivitiesPhase(db, athleteId, syncJobId, options);
      await syncStreamsPhase(db, athleteId, syncJobId);
    }
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

interface SyncActivitiesOptions {
  after?: number; // epoch seconds for Strava `after` param
  detectUpdates?: boolean; // conditionally reset areStreamsLoaded on metadata changes
}

async function syncActivitiesPhase(
  db: Database,
  athleteId: number,
  syncJobId: number,
  options: SyncActivitiesOptions = {},
) {
  const accessToken = await getAccessToken(db, athleteId);

  let page = 1;
  let totalInserted = 0;

  for (;;) {
    // Check if job is still active
    const job = await db.query.syncJobs.findFirst({
      where: eq(syncJobs.id, syncJobId),
    });
    if (!job || job.status !== "fetching_activities") return;

    const pageActivities = await strava.athlete.listActivities({
      access_token: accessToken,
      per_page: PAGE_SIZE,
      page,
      ...(options.after != null ? { after: options.after } : {}),
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
        set: {
          type: sql`excluded.type`,
          name: sql`excluded.name`,
          distance: sql`excluded.distance`,
          totalElevationGain: sql`excluded.total_elevation_gain`,
          averageSpeed: sql`excluded.average_speed`,
          averageWatts: sql`excluded.average_watts`,
          averageCadence: sql`excluded.average_cadence`,
          averageHeartrate: sql`excluded.average_heartrate`,
          maxHeartrate: sql`excluded.max_heartrate`,
          maxSpeed: sql`excluded.max_speed`,
          maxWatts: sql`excluded.max_watts`,
          weightedAverageWatts: sql`excluded.weighted_average_watts`,
          kilojoules: sql`excluded.kilojoules`,
          calories: sql`excluded.calories`,
          movingTime: sql`excluded.moving_time`,
          elapsedTime: sql`excluded.elapsed_time`,
          mapPolyline: sql`excluded.map_polyline`,
          workoutType: sql`excluded.workout_type`,
          ...(options.detectUpdates
            ? {
                areStreamsLoaded: sql`CASE
                  WHEN activities.distance != excluded.distance
                    OR activities.moving_time != excluded.moving_time
                    OR activities.elapsed_time != excluded.elapsed_time
                    OR activities.average_watts IS DISTINCT FROM excluded.average_watts
                    OR activities.weighted_average_watts IS DISTINCT FROM excluded.weighted_average_watts
                  THEN false
                  ELSE activities.are_streams_loaded
                END`,
              }
            : {}),
        },
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

  for (;;) {
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
    console.warn(
      `[sync] No rider settings found for athlete ${athleteId} — ` +
        "TSS/HRSS will be skipped, but power bests will still be computed.",
    );
  }

  let cursor: string | undefined;

  for (;;) {
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

    await computeActivityScoresBatch(db, batch, settingsDoc ?? null);

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
  settingsDoc: SettingsDocForScoring | null,
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
          inArray(activityStreams.type, ["time", "heartrate", "watts"]),
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
  settingsDoc: SettingsDocForScoring | null,
  preloadedStreams?: StreamDoc[],
) {
  const settings = settingsDoc
    ? resolveRiderSettings(
        settingsDoc,
        activity.startDateLocal.slice(0, 10),
      )
    : null;

  const patch: {
    tss?: number;
    hrss?: number;
    powerBests?: Record<number, number> | null;
  } = {};

  if (
    settings &&
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
            inArray(activityStreams.type, ["time", "heartrate", "watts"]),
          ),
        ));

    // Extract time stream (used for accurate HRSS and power bests)
    const timeDocs = streamDocs
      .filter((s) => s.type === "time")
      .sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));
    let timeData: number[] | undefined;
    if (timeDocs.length > 0) {
      timeData = [];
      for (const doc of timeDocs) {
        timeData.push(...(JSON.parse(doc.data) as number[]));
      }
    }

    if (settings) {
      const hrDocs = streamDocs
        .filter((s) => s.type === "heartrate")
        .sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));

      if (hrDocs.length > 0) {
        const hrData: number[] = [];
        for (const doc of hrDocs) {
          hrData.push(...(JSON.parse(doc.data) as number[]));
        }
        patch.hrss = Math.round(calculateHRSS(hrData, settings, timeData));
      }
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
        patch.powerBests = computePowerBests(wattsData, timeData);
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

  if (!settingsDoc) {
    console.warn(
      `[sync] No rider settings found for athlete ${athleteId} — ` +
        "TSS/HRSS will be skipped, but power bests will still be computed.",
    );
  }

  let cursor: string | undefined;

  for (;;) {
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

    await computeActivityScoresBatch(db, batch, settingsDoc ?? null);

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
