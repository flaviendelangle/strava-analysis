import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  athletes: defineTable({
    stravaAthleteId: v.number(),
    accessToken: v.string(),
    name: v.optional(v.string()),
  }).index("by_strava_id", ["stravaAthleteId"]),

  activities: defineTable({
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
    areStreamsLoaded: v.boolean(),
    hrss: v.optional(v.number()),
    tss: v.optional(v.number()),
  })
    .index("by_athlete", ["athlete"])
    .index("by_strava_id", ["stravaId"])
    .index("by_athlete_and_start_date", ["athlete", "startDate"])
    .index("by_athlete_and_streams_loaded", ["athlete", "areStreamsLoaded"]),

  riderSettings: defineTable({
    athlete: v.number(),
    cdA: v.number(),
    crr: v.number(),
    bikeWeightKg: v.optional(v.number()),
    initialValues: v.object({
      ftp: v.number(),
      weightKg: v.number(),
      restingHr: v.number(),
      maxHr: v.number(),
      lthr: v.number(),
    }),
    changes: v.array(
      v.object({
        id: v.string(),
        date: v.string(),
        ftp: v.optional(v.number()),
        weightKg: v.optional(v.number()),
        restingHr: v.optional(v.number()),
        maxHr: v.optional(v.number()),
        lthr: v.optional(v.number()),
      }),
    ),
  }).index("by_athlete", ["athlete"]),

  syncJobs: defineTable({
    athlete: v.number(),
    status: v.union(
      v.literal("fetching_activities"),
      v.literal("fetching_streams"),
      v.literal("computing_scores"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    activitiesFetched: v.number(),
    activitiesPagesComplete: v.boolean(),
    streamsTotal: v.number(),
    streamsFetched: v.number(),
    lastError: v.optional(v.string()),
    startedAt: v.number(),
  }).index("by_athlete", ["athlete"]),

  activityStreams: defineTable({
    activity: v.id("activities"),
    type: v.string(),
    seriesType: v.string(),
    originalSize: v.number(),
    resolution: v.string(),
    chunkIndex: v.optional(v.number()),
    data: v.string(),
  }).index("by_activity", ["activity"]),
});
