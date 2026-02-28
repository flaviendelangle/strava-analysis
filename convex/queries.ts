import { v } from "convex/values";

import { internalQuery, query } from "./_generated/server";

export const listActivities = query({
  args: {
    athleteId: v.number(),
    activityTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let activities = await ctx.db
      .query("activities")
      .withIndex("by_athlete", (q) => q.eq("athlete", args.athleteId))
      .collect();

    if (args.activityTypes && args.activityTypes.length > 0) {
      activities = activities.filter((a) =>
        args.activityTypes!.includes(a.type),
      );
    }

    return activities.map(({ mapPolyline, ...rest }) => rest);
  },
});

export const listActivitiesWithMap = query({
  args: {
    athleteId: v.number(),
    activityTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let activities = await ctx.db
      .query("activities")
      .withIndex("by_athlete", (q) => q.eq("athlete", args.athleteId))
      .collect();

    if (args.activityTypes && args.activityTypes.length > 0) {
      activities = activities.filter((a) =>
        args.activityTypes!.includes(a.type),
      );
    }

    return activities;
  },
});

export const getActivity = query({
  args: { stravaId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_strava_id", (q) => q.eq("stravaId", args.stravaId))
      .first();
  },
});

export const getActivityStreams = query({
  args: { stravaId: v.number() },
  handler: async (ctx, args) => {
    const activity = await ctx.db
      .query("activities")
      .withIndex("by_strava_id", (q) => q.eq("stravaId", args.stravaId))
      .first();

    if (!activity) {
      throw new Error(`Activity with stravaId ${args.stravaId} not found`);
    }

    if (!activity.areStreamsLoaded) {
      return null;
    }

    const streams = await ctx.db
      .query("activityStreams")
      .withIndex("by_activity", (q) => q.eq("activity", activity._id))
      .collect();

    return streams.map((s) => ({ type: s.type, data: s.data }));
  },
});

export const activityTypes = query({
  args: { athleteId: v.number() },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_athlete", (q) => q.eq("athlete", args.athleteId))
      .collect();

    const types = [...new Set(activities.map((a) => a.type))];
    return types.sort();
  },
});

// Internal queries (used by actions)

export const getAthleteByStravaId = internalQuery({
  args: { stravaAthleteId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("athletes")
      .withIndex("by_strava_id", (q) =>
        q.eq("stravaAthleteId", args.stravaAthleteId),
      )
      .first();
  },
});

export const getLatestActivity = internalQuery({
  args: { athleteId: v.number() },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_athlete", (q) => q.eq("athlete", args.athleteId))
      .collect();

    if (activities.length === 0) return null;
    return activities.sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  },
});

export const getOldestActivity = internalQuery({
  args: { athleteId: v.number() },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_athlete", (q) => q.eq("athlete", args.athleteId))
      .collect();

    if (activities.length === 0) return null;
    return activities.sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  },
});

export const getActivityByStravaId = internalQuery({
  args: { stravaId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_strava_id", (q) => q.eq("stravaId", args.stravaId))
      .first();
  },
});
