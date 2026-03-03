import { and, asc, count, desc, eq, gt, inArray } from "drizzle-orm";
import strava from "strava-v3";

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
import { POWER_BEST_ACTIVITY_TYPES } from "../../src/utils/constants";
import type { normalizeStreams } from "./strava";
import {
  fetchStreamsFromStrava,
  getAccessToken,
  getModelFromStravaActivity,
} from "./strava";

const PAGE_SIZE = 50;
const BATCH_SIZE = 50;

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

  // Get latest activity to use as `after` parameter
  const latestActivity = await db
    .select({ startDate: activities.startDate })
    .from(activities)
    .where(eq(activities.athlete, athleteId))
    .orderBy(desc(activities.startDate))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  const afterTimestamp = latestActivity
    ? Math.floor(new Date(latestActivity.startDate).getTime() / 1000)
    : undefined;

  let page = 1;
  let totalInserted = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Check if job is still active
    const job = await db.query.syncJobs.findFirst({
      where: eq(syncJobs.id, syncJobId),
    });
    if (!job || job.status !== "fetching_activities") return;

    const stravaParams: Record<string, unknown> = {
      access_token: accessToken,
      per_page: PAGE_SIZE,
      page,
    };
    if (afterTimestamp) {
      stravaParams.after = afterTimestamp;
    }

    const pageActivities = await strava.athlete.listActivities(stravaParams);

    if (pageActivities.length > 0) {
      const models = pageActivities.map((raw) => ({
        ...getModelFromStravaActivity(raw),
        areStreamsLoaded: false,
      }));

      const inserted = await db
        .insert(activities)
        .values(models)
        .onConflictDoNothing({ target: activities.stravaId })
        .returning({ id: activities.id });

      const insertedCount = inserted.length;
      totalInserted += insertedCount;

      await db
        .update(syncJobs)
        .set({ activitiesFetched: totalInserted })
        .where(eq(syncJobs.id, syncJobId));

      if (pageActivities.length === PAGE_SIZE && insertedCount > 0) {
        page++;
        await delay(5_000);
        continue;
      }
    }

    break;
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

    for (const activity of batch) {
      try {
        const normalized = await fetchStreamsFromStrava(
          accessToken,
          activity.stravaId,
        );

        await storeStreams(db, activity.id, normalized);
        totalFetched++;
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
      }
    }

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

    for (const activity of batch) {
      await computeActivityScoresInternal(db, activity, settingsDoc);
    }

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

export async function computeActivityScoresInternal(
  db: Database,
  activity: {
    id: number;
    athlete: number;
    type: string;
    startDateLocal: string;
    weightedAverageWatts: number | null;
    areStreamsLoaded: boolean;
    movingTime: number;
  },
  settingsDoc: {
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
  },
) {
  const activityDate = activity.startDateLocal.slice(0, 10);
  const settings = resolveRiderSettings(settingsDoc, activityDate);

  const patch: {
    tss?: number;
    hrss?: number;
    powerBests?: Record<number, number> | null;
  } = {};

  if (activity.weightedAverageWatts != null && POWER_BEST_ACTIVITY_TYPES.includes(activity.type)) {
    patch.tss = Math.round(
      calculateTSS(
        activity.weightedAverageWatts,
        activity.movingTime,
        settings.ftp,
      ),
    );
  }

  if (activity.areStreamsLoaded) {
    const streamDocs = await db
      .select()
      .from(activityStreams)
      .where(
        and(
          eq(activityStreams.activityId, activity.id),
          inArray(activityStreams.type, ["heartrate", "watts"]),
        ),
      );

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

    for (const activity of batch) {
      await computeActivityScoresInternal(db, activity, settingsDoc);
    }

    cursor = batch[batch.length - 1].startDate;
    if (batch.length < BATCH_SIZE) break;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
