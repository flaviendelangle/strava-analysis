import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const activitiesTable = sqliteTable("activities", {
  // General information
  id: integer("id", { mode: "number" }).primaryKey({
    autoIncrement: true,
  }),
  athlete: integer("athlete").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  startDateLocal: text("start_date_local").notNull(),

  // Metrics
  distance: real("distance").notNull(),
  totalElevationGain: real("total_elevation_gain").notNull(),
  averageSpeed: real("average_speed").notNull(),
  averageWatts: real("average_watts"),
  averageCadence: real("average_cadence"),
  movingTime: integer("moving_time").notNull(),
  elapsedTime: integer("elapsed_time").notNull(),

  // Map data
  mapPolyline: text("map_polyline"),

  // Meta data
  areStreamsLoaded: integer("are_streams_loaded", {
    mode: "boolean",
  }).notNull(),
});

export const activityStreamTable = sqliteTable("activity_streams", {
  primaryKey: integer("primaryKey", { mode: "number" }).primaryKey({
    autoIncrement: true,
  }),

  activity: integer("activity")
    .references(() => activitiesTable.id)
    .notNull(),
  type: text("name").notNull(), // "heartrate" | "watts" | "cadence" | "distance" | "altitude"
  seriesType: text("series_type").notNull(), // "distance" | ???
  originalSize: integer("original_size").notNull(),
  resolution: text("resolution").notNull(),
  data: text("data", { mode: "json" }).notNull(),
});
