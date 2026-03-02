import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";
import {
  calculateHRSS,
  calculateTSS,
  resolveRiderSettings,
} from "./computeScores";

// ── Validators ──────────────────────────────────────────────────────────

const activityValidator = v.object({
  stravaId: v.number(),
  athlete: v.number(),
  type: v.string(),
  name: v.string(),
  startDate: v.string(),
  startDateLocal: v.string(),
  distance: v.number(),
  totalElevationGain: v.number(),
  averageSpeed: v.number(),
  averageWatts: v.optional(v.number()),
  averageCadence: v.optional(v.number()),
  averageHeartrate: v.optional(v.number()),
  maxHeartrate: v.optional(v.number()),
  maxSpeed: v.optional(v.number()),
  maxWatts: v.optional(v.number()),
  weightedAverageWatts: v.optional(v.number()),
  kilojoules: v.optional(v.number()),
  calories: v.optional(v.number()),
  movingTime: v.number(),
  elapsedTime: v.number(),
  mapPolyline: v.optional(v.string()),
});

const riderSettingsChangePointValidator = v.object({
  id: v.string(),
  date: v.string(),
  ftp: v.optional(v.number()),
  weightKg: v.optional(v.number()),
  restingHr: v.optional(v.number()),
  maxHr: v.optional(v.number()),
  lthr: v.optional(v.number()),
});

const riderSettingsInitialValuesValidator = v.object({
  ftp: v.number(),
  weightKg: v.number(),
  restingHr: v.number(),
  maxHr: v.number(),
  lthr: v.number(),
});

// ── Public mutations ────────────────────────────────────────────────────

export const upsertAthlete = mutation({
  args: {
    stravaAthleteId: v.number(),
    accessToken: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("athletes")
      .withIndex("by_strava_id", (q) =>
        q.eq("stravaAthleteId", args.stravaAthleteId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        name: args.name,
      });
    } else {
      await ctx.db.insert("athletes", {
        stravaAthleteId: args.stravaAthleteId,
        accessToken: args.accessToken,
        name: args.name,
      });
    }
  },
});

export const saveRiderSettings = mutation({
  args: {
    athleteId: v.number(),
    cdA: v.number(),
    crr: v.number(),
    bikeWeightKg: v.number(),
    initialValues: riderSettingsInitialValuesValidator,
    changes: v.array(riderSettingsChangePointValidator),
  },
  handler: async (ctx, args) => {
    const { athleteId, ...data } = args;

    // Ensure changes are sorted by date
    data.changes = [...data.changes].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const existing = await ctx.db
      .query("riderSettings")
      .withIndex("by_athlete", (q) => q.eq("athlete", athleteId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("riderSettings", { athlete: athleteId, ...data });
    }

    // Recompute HRSS/TSS for all activities with the updated settings
    await ctx.scheduler.runAfter(
      0,
      internal.mutations.recomputeAllScores,
      { athleteId },
    );
  },
});

export const startSync = mutation({
  args: { athleteId: v.number() },
  handler: async (ctx, args) => {
    // Check for existing in-progress sync job
    const existing = await ctx.db
      .query("syncJobs")
      .withIndex("by_athlete", (q) => q.eq("athlete", args.athleteId))
      .first();

    if (
      existing &&
      (existing.status === "fetching_activities" ||
        existing.status === "fetching_streams" ||
        existing.status === "computing_scores")
    ) {
      return existing._id;
    }

    // Get latest activity for the `after` Strava parameter
    const latestActivity = await ctx.db
      .query("activities")
      .withIndex("by_athlete_and_start_date", (q) =>
        q.eq("athlete", args.athleteId),
      )
      .order("desc")
      .first();

    const now = Date.now();
    let syncJobId;

    if (existing) {
      // Reuse existing document (completed/failed)
      await ctx.db.patch(existing._id, {
        status: "fetching_activities" as const,
        activitiesFetched: 0,
        activitiesPagesComplete: false,
        streamsTotal: 0,
        streamsFetched: 0,
        lastError: undefined,
        startedAt: now,
      });
      syncJobId = existing._id;
    } else {
      syncJobId = await ctx.db.insert("syncJobs", {
        athlete: args.athleteId,
        status: "fetching_activities",
        activitiesFetched: 0,
        activitiesPagesComplete: false,
        streamsTotal: 0,
        streamsFetched: 0,
        startedAt: now,
      });
    }

    await ctx.scheduler.runAfter(
      0,
      internal.actions.syncActivitiesBatch,
      {
        athleteId: args.athleteId,
        syncJobId,
        afterTimestamp: latestActivity
          ? Math.floor(
              new Date(latestActivity.startDate).getTime() / 1000,
            )
          : undefined,
        page: 1,
      },
    );

    return syncJobId;
  },
});

// ── Internal mutations: sync ────────────────────────────────────────────

export const insertActivitiesBatch = internalMutation({
  args: { activities: v.array(activityValidator) },
  handler: async (ctx, args) => {
    let insertedCount = 0;
    for (const activity of args.activities) {
      const existing = await ctx.db
        .query("activities")
        .withIndex("by_strava_id", (q) => q.eq("stravaId", activity.stravaId))
        .first();

      if (!existing) {
        await ctx.db.insert("activities", {
          ...activity,
          areStreamsLoaded: false,
        });
        insertedCount++;
      }
    }
    return insertedCount;
  },
});

export const updateSyncJob = internalMutation({
  args: {
    syncJobId: v.id("syncJobs"),
    patch: v.object({
      status: v.optional(
        v.union(
          v.literal("fetching_activities"),
          v.literal("fetching_streams"),
          v.literal("computing_scores"),
          v.literal("completed"),
          v.literal("failed"),
        ),
      ),
      activitiesFetched: v.optional(v.number()),
      activitiesPagesComplete: v.optional(v.boolean()),
      streamsTotal: v.optional(v.number()),
      streamsFetched: v.optional(v.number()),
      lastError: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.syncJobId, args.patch);
  },
});

// ~500KB as JSON, safely under the 1MB Convex document limit.
const MAX_ELEMENTS_PER_DOC = 100_000;

export const storeActivityStreamsBatch = internalMutation({
  args: {
    stravaId: v.number(),
    streams: v.array(
      v.object({
        type: v.string(),
        seriesType: v.string(),
        originalSize: v.number(),
        resolution: v.string(),
        data: v.string(),
      }),
    ),
    scheduleScoreComputation: v.boolean(),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db
      .query("activities")
      .withIndex("by_strava_id", (q) => q.eq("stravaId", args.stravaId))
      .first();

    if (!activity) {
      throw new Error(`Activity with stravaId ${args.stravaId} not found`);
    }

    for (const stream of args.streams) {
      const data = JSON.parse(stream.data) as number[];
      const streamMeta = {
        type: stream.type,
        seriesType: stream.seriesType,
        originalSize: stream.originalSize,
        resolution: stream.resolution,
      };

      if (data.length <= MAX_ELEMENTS_PER_DOC) {
        await ctx.db.insert("activityStreams", {
          activity: activity._id,
          ...streamMeta,
          data: stream.data,
        });
      } else {
        for (let i = 0; i < data.length; i += MAX_ELEMENTS_PER_DOC) {
          await ctx.db.insert("activityStreams", {
            activity: activity._id,
            ...streamMeta,
            chunkIndex: Math.floor(i / MAX_ELEMENTS_PER_DOC),
            data: JSON.stringify(data.slice(i, i + MAX_ELEMENTS_PER_DOC)),
          });
        }
      }
    }

    await ctx.db.patch(activity._id, { areStreamsLoaded: true });

    if (args.scheduleScoreComputation) {
      await ctx.scheduler.runAfter(
        0,
        internal.mutations.computeActivityScores,
        { activityId: activity._id },
      );
    }
  },
});

export const computeScoresBatch = internalMutation({
  args: {
    athleteId: v.number(),
    syncJobId: v.id("syncJobs"),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const BATCH_SIZE = 50;

    const batch = await ctx.db
      .query("activities")
      .withIndex("by_athlete_and_start_date", (q) => {
        const base = q.eq("athlete", args.athleteId);
        return args.cursor ? base.gt("startDate", args.cursor) : base;
      })
      .order("asc")
      .take(BATCH_SIZE);

    if (batch.length === 0) {
      await ctx.db.patch(args.syncJobId, { status: "completed" });
      return;
    }

    const settingsDoc = await ctx.db
      .query("riderSettings")
      .withIndex("by_athlete", (q) => q.eq("athlete", args.athleteId))
      .first();

    if (settingsDoc) {
      for (const activity of batch) {
        const activityDate = activity.startDateLocal.slice(0, 10);
        const settings = resolveRiderSettings(settingsDoc, activityDate);

        const patch: { tss?: number; hrss?: number } = {};

        if (activity.weightedAverageWatts != null) {
          patch.tss = Math.round(
            calculateTSS(
              activity.weightedAverageWatts,
              activity.movingTime,
              settings.ftp,
            ),
          );
        }

        if (activity.areStreamsLoaded) {
          const hrDocs = (
            await ctx.db
              .query("activityStreams")
              .withIndex("by_activity", (q) =>
                q.eq("activity", activity._id),
              )
              .collect()
          )
            .filter((s) => s.type === "heartrate")
            .sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));

          if (hrDocs.length > 0) {
            const hrData: number[] = [];
            for (const doc of hrDocs) {
              hrData.push(...(JSON.parse(doc.data) as number[]));
            }
            patch.hrss = Math.round(calculateHRSS(hrData, settings));
          }
        }

        if (Object.keys(patch).length > 0) {
          await ctx.db.patch(activity._id, patch);
        }
      }
    }

    if (batch.length === BATCH_SIZE) {
      // More activities to process
      const lastActivity = batch[batch.length - 1];
      await ctx.scheduler.runAfter(
        0,
        internal.mutations.computeScoresBatch,
        {
          athleteId: args.athleteId,
          syncJobId: args.syncJobId,
          cursor: lastActivity.startDate,
        },
      );
    } else {
      // Last batch — sync complete
      await ctx.db.patch(args.syncJobId, { status: "completed" });
    }
  },
});

// ── Internal mutations: activity management ─────────────────────────────

export const updateActivity = internalMutation({
  args: {
    stravaId: v.number(),
    data: v.object({
      type: v.string(),
      name: v.string(),
      startDate: v.string(),
      startDateLocal: v.string(),
      distance: v.number(),
      totalElevationGain: v.number(),
      averageSpeed: v.number(),
      averageWatts: v.optional(v.number()),
      averageCadence: v.optional(v.number()),
      averageHeartrate: v.optional(v.number()),
      maxHeartrate: v.optional(v.number()),
      maxSpeed: v.optional(v.number()),
      maxWatts: v.optional(v.number()),
      weightedAverageWatts: v.optional(v.number()),
      kilojoules: v.optional(v.number()),
      calories: v.optional(v.number()),
      movingTime: v.number(),
      elapsedTime: v.number(),
      mapPolyline: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db
      .query("activities")
      .withIndex("by_strava_id", (q) => q.eq("stravaId", args.stravaId))
      .first();

    if (!activity) {
      throw new Error(`Activity with stravaId ${args.stravaId} not found`);
    }

    await ctx.db.patch(activity._id, {
      ...args.data,
      areStreamsLoaded: false,
    });
  },
});

export const deleteActivityStreams = internalMutation({
  args: { stravaId: v.number() },
  handler: async (ctx, args) => {
    const activity = await ctx.db
      .query("activities")
      .withIndex("by_strava_id", (q) => q.eq("stravaId", args.stravaId))
      .first();

    if (!activity) {
      throw new Error(`Activity with stravaId ${args.stravaId} not found`);
    }

    const streams = await ctx.db
      .query("activityStreams")
      .withIndex("by_activity", (q) => q.eq("activity", activity._id))
      .collect();

    for (const stream of streams) {
      await ctx.db.delete(stream._id);
    }
  },
});

// ── Internal mutations: score computation ───────────────────────────────

export const computeActivityScores = internalMutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) return;

    const settingsDoc = await ctx.db
      .query("riderSettings")
      .withIndex("by_athlete", (q) => q.eq("athlete", activity.athlete))
      .first();

    if (!settingsDoc) return;

    const activityDate = activity.startDateLocal.slice(0, 10);
    const settings = resolveRiderSettings(settingsDoc, activityDate);

    const patch: { tss?: number; hrss?: number } = {};

    // TSS: only needs metadata + ftp
    if (activity.weightedAverageWatts != null) {
      patch.tss = Math.round(
        calculateTSS(
          activity.weightedAverageWatts,
          activity.movingTime,
          settings.ftp,
        ),
      );
    }

    // HRSS: needs HR stream data
    if (activity.areStreamsLoaded) {
      const hrDocs = (
        await ctx.db
          .query("activityStreams")
          .withIndex("by_activity", (q) => q.eq("activity", activity._id))
          .collect()
      )
        .filter((s) => s.type === "heartrate")
        .sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));

      if (hrDocs.length > 0) {
        const hrData: number[] = [];
        for (const doc of hrDocs) {
          hrData.push(...(JSON.parse(doc.data) as number[]));
        }
        patch.hrss = Math.round(calculateHRSS(hrData, settings));
      }
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(activity._id, patch);
    }
  },
});

export const recomputeAllScores = internalMutation({
  args: { athleteId: v.number() },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_athlete", (q) => q.eq("athlete", args.athleteId))
      .collect();

    for (const activity of activities) {
      await ctx.scheduler.runAfter(
        0,
        internal.mutations.computeActivityScores,
        { activityId: activity._id },
      );
    }
  },
});
