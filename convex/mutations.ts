import { v } from "convex/values";

import { internalMutation, mutation } from "./_generated/server";

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

    return await ctx.db.insert("activities", {
      ...args,
      areStreamsLoaded: false,
    });
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

export const storeActivityStreams = internalMutation({
  args: {
    stravaId: v.number(),
    streams: v.array(
      v.object({
        type: v.string(),
        seriesType: v.string(),
        originalSize: v.number(),
        resolution: v.string(),
        data: v.array(v.number()),
      }),
    ),
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
      await ctx.db.insert("activityStreams", {
        activity: activity._id,
        ...stream,
      });
    }

    await ctx.db.patch(activity._id, { areStreamsLoaded: true });
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
