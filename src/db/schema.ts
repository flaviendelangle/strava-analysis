import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const activitiesTable = sqliteTable("activities", {
  primaryKey: integer("primaryKey", { mode: "number" }).primaryKey({
    autoIncrement: true,
  }),

  // General information
  id: integer("id").notNull(),
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
  map_polyline: text("map_polyline"),
});
