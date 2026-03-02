import { v } from "convex/values";

import { internalQuery, query } from "./_generated/server";

// ── Public queries ──────────────────────────────────────────────────────

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

    const USABLE_TYPES = new Set([
      "heartrate",
      "watts",
      "cadence",
      "velocity_smooth",
      "altitude",
      "distance",
    ]);

    // Group by type and merge chunks (rare, only for ultra-long activities)
    const grouped = new Map<string, string[]>();
    for (const s of streams) {
      if (!USABLE_TYPES.has(s.type)) continue;
      const existing = grouped.get(s.type);
      if (existing) {
        existing.push(s.data);
      } else {
        grouped.set(s.type, [s.data]);
      }
    }

    // If no usable streams exist, return null to trigger a re-fetch
    if (grouped.size === 0) {
      return null;
    }

    return Array.from(grouped, ([type, chunks]) => ({
      type,
      data:
        chunks.length === 1
          ? chunks[0]
          : JSON.stringify(
              chunks.flatMap((c) => JSON.parse(c) as number[]),
            ),
    }));
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

export const getRiderSettings = query({
  args: { athleteId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("riderSettings")
      .withIndex("by_athlete", (q) => q.eq("athlete", args.athleteId))
      .first();
  },
});

export const getSyncJob = query({
  args: { athleteId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("syncJobs")
      .withIndex("by_athlete", (q) => q.eq("athlete", args.athleteId))
      .first();
  },
});

// ── Internal queries ────────────────────────────────────────────────────

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
    return await ctx.db
      .query("activities")
      .withIndex("by_athlete_and_start_date", (q) =>
        q.eq("athlete", args.athleteId),
      )
      .order("desc")
      .first();
  },
});

export const getActivitiesWithoutStreams = internalQuery({
  args: { athleteId: v.number(), limit: v.number() },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_athlete_and_streams_loaded", (q) =>
        q.eq("athlete", args.athleteId).eq("areStreamsLoaded", false),
      )
      .collect();

    return activities
      .filter((a) => a.averageHeartrate != null)
      .slice(0, args.limit)
      .map((a) => ({ stravaId: a.stravaId, _id: a._id }));
  },
});

export const getSyncJobById = internalQuery({
  args: { syncJobId: v.id("syncJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.syncJobId);
  },
});
