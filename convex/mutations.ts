import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";
import {
  calculateHRSS,
  calculateTSS,
  resolveRiderSettings,
} from "./computeScores";

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

export const insertActivity = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("activities")
      .withIndex("by_strava_id", (q) => q.eq("stravaId", args.stravaId))
      .first();

    if (existing) {
      return existing._id;
    }

    const activityId = await ctx.db.insert("activities", {
      ...args,
      areStreamsLoaded: false,
    });

    // Compute TSS immediately (HRSS will be computed when streams arrive)
    await ctx.scheduler.runAfter(
      0,
      internal.mutations.computeActivityScores,
      { activityId },
    );

    return activityId;
  },
});

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

// ~500KB as JSON, safely under the 1MB Convex document limit.
// Only ultra-long activities (27+ hours) will need a second document.
const MAX_ELEMENTS_PER_DOC = 100_000;

export const storeActivityStream = internalMutation({
  args: {
    stravaId: v.number(),
    type: v.string(),
    seriesType: v.string(),
    originalSize: v.number(),
    resolution: v.string(),
    data: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db
      .query("activities")
      .withIndex("by_strava_id", (q) => q.eq("stravaId", args.stravaId))
      .first();

    if (!activity) {
      throw new Error(`Activity with stravaId ${args.stravaId} not found`);
    }

    const { stravaId: _, data, ...streamData } = args;
    for (let i = 0; i < data.length; i += MAX_ELEMENTS_PER_DOC) {
      await ctx.db.insert("activityStreams", {
        activity: activity._id,
        ...streamData,
        ...(data.length > MAX_ELEMENTS_PER_DOC
          ? { chunkIndex: Math.floor(i / MAX_ELEMENTS_PER_DOC) }
          : {}),
        data: JSON.stringify(data.slice(i, i + MAX_ELEMENTS_PER_DOC)),
      });
    }
  },
});

export const markStreamsLoaded = internalMutation({
  args: { stravaId: v.number() },
  handler: async (ctx, args) => {
    const activity = await ctx.db
      .query("activities")
      .withIndex("by_strava_id", (q) => q.eq("stravaId", args.stravaId))
      .first();

    if (!activity) {
      throw new Error(`Activity with stravaId ${args.stravaId} not found`);
    }

    await ctx.db.patch(activity._id, { areStreamsLoaded: true });

    // Compute HRSS/TSS now that streams are available
    await ctx.scheduler.runAfter(
      0,
      internal.mutations.computeActivityScores,
      { activityId: activity._id },
    );
  },
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
        calculateTSS(activity.weightedAverageWatts, activity.movingTime, settings.ftp),
      );
    }

    // HRSS: needs HR stream data
    if (activity.areStreamsLoaded) {
      const streamDocs = await ctx.db
        .query("activityStreams")
        .withIndex("by_activity", (q) => q.eq("activity", activity._id))
        .collect();

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

// ── Temporary migration: deduplicate stream docs ────────────────────────

export const deduplicateStreams = mutation({
  args: { athleteId: v.number() },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_athlete", (q) => q.eq("athlete", args.athleteId))
      .collect();

    const withStreams = activities.filter((a) => a.areStreamsLoaded);
    const BATCH = 500;
    const firstBatch = withStreams.slice(0, BATCH);

    for (const activity of firstBatch) {
      await ctx.scheduler.runAfter(
        0,
        internal.mutations.deduplicateActivityStreams,
        { activityId: activity._id },
      );
    }

    if (withStreams.length > BATCH) {
      const remaining = withStreams.slice(BATCH).map((a) => a._id);
      await ctx.scheduler.runAfter(
        0,
        internal.mutations.deduplicateStreamsBatch,
        { activityIds: remaining },
      );
    }
  },
});

export const deduplicateStreamsBatch = internalMutation({
  args: { activityIds: v.array(v.id("activities")) },
  handler: async (ctx, args) => {
    const BATCH = 500;
    const currentBatch = args.activityIds.slice(0, BATCH);

    for (const activityId of currentBatch) {
      await ctx.scheduler.runAfter(
        0,
        internal.mutations.deduplicateActivityStreams,
        { activityId },
      );
    }

    if (args.activityIds.length > BATCH) {
      await ctx.scheduler.runAfter(
        0,
        internal.mutations.deduplicateStreamsBatch,
        { activityIds: args.activityIds.slice(BATCH) },
      );
    }
  },
});

export const deduplicateActivityStreams = internalMutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const streams = await ctx.db
      .query("activityStreams")
      .withIndex("by_activity", (q) => q.eq("activity", args.activityId))
      .collect();

    // Group by type
    const byType = new Map<string, typeof streams>();
    for (const s of streams) {
      const group = byType.get(s.type);
      if (group) group.push(s);
      else byType.set(s.type, [s]);
    }

    let changed = false;

    for (const [type, docs] of byType) {
      // Group by chunkIndex to identify duplicates
      const byChunk = new Map<number, typeof docs>();
      for (const doc of docs) {
        const ci = doc.chunkIndex ?? 0;
        const group = byChunk.get(ci);
        if (group) group.push(doc);
        else byChunk.set(ci, [doc]);
      }

      // Delete duplicate docs (keep first per chunkIndex)
      for (const [, chunkDocs] of byChunk) {
        if (chunkDocs.length > 1) {
          changed = true;
          for (let i = 1; i < chunkDocs.length; i++) {
            await ctx.db.delete(chunkDocs[i]._id);
          }
        }
      }

      // Merge remaining chunks into a single doc if multiple exist
      const remaining = [...byChunk.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, chunkDocs]) => chunkDocs[0]);

      if (remaining.length > 1) {
        changed = true;
        const merged: number[] = [];
        for (const doc of remaining) {
          merged.push(...(JSON.parse(doc.data) as number[]));
        }
        for (const doc of remaining) {
          await ctx.db.delete(doc._id);
        }
        await ctx.db.insert("activityStreams", {
          activity: args.activityId,
          type,
          seriesType: remaining[0].seriesType,
          originalSize: remaining[0].originalSize,
          resolution: remaining[0].resolution,
          data: JSON.stringify(merged),
        });
      }
    }

    if (changed) {
      await ctx.scheduler.runAfter(
        0,
        internal.mutations.computeActivityScores,
        { activityId: args.activityId },
      );
    }
  },
});

