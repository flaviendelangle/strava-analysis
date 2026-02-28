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
    movingTime: v.number(),
    elapsedTime: v.number(),
    mapPolyline: v.optional(v.string()),
    areStreamsLoaded: v.boolean(),
  })
    .index("by_athlete", ["athlete"])
    .index("by_strava_id", ["stravaId"])
    .index("by_athlete_and_start_date", ["athlete", "startDate"]),

  activityStreams: defineTable({
    activity: v.id("activities"),
    type: v.string(),
    seriesType: v.string(),
    originalSize: v.number(),
    resolution: v.string(),
    data: v.array(v.number()),
  }).index("by_activity", ["activity"]),
});
