import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────

export const syncJobStatusEnum = pgEnum("sync_job_status", [
  "fetching_activities",
  "fetching_streams",
  "computing_scores",
  "completed",
  "failed",
]);

// ── Tables ─────────────────────────────────────────────────────────────

export const athletes = pgTable(
  "athletes",
  {
    id: serial("id").primaryKey(),
    stravaAthleteId: bigint("strava_athlete_id", { mode: "number" }).notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull().default(""),
    tokenExpiresAt: integer("token_expires_at").notNull().default(0),
    name: text("name"),
  },
  (t) => [uniqueIndex("athletes_strava_id_idx").on(t.stravaAthleteId)],
);

export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    stravaId: bigint("strava_id", { mode: "number" }).notNull(),
    athlete: integer("athlete").notNull(),
    type: text("type").notNull(),
    name: text("name").notNull(),
    startDate: text("start_date").notNull(),
    startDateLocal: text("start_date_local").notNull(),
    distance: real("distance").notNull(),
    totalElevationGain: real("total_elevation_gain").notNull(),
    averageSpeed: real("average_speed").notNull(),
    averageWatts: real("average_watts"),
    averageCadence: real("average_cadence"),
    averageHeartrate: real("average_heartrate"),
    maxHeartrate: real("max_heartrate"),
    maxSpeed: real("max_speed"),
    maxWatts: real("max_watts"),
    weightedAverageWatts: real("weighted_average_watts"),
    kilojoules: real("kilojoules"),
    calories: real("calories"),
    movingTime: integer("moving_time").notNull(),
    elapsedTime: integer("elapsed_time").notNull(),
    mapPolyline: text("map_polyline"),
    areStreamsLoaded: boolean("are_streams_loaded").notNull().default(false),
    hrss: real("hrss"),
    tss: real("tss"),
    powerBests: jsonb("power_bests").$type<Record<number, number>>(),
  },
  (t) => [
    uniqueIndex("activities_strava_id_idx").on(t.stravaId),
    index("activities_athlete_idx").on(t.athlete),
    index("activities_athlete_start_date_idx").on(t.athlete, t.startDate),
    index("activities_athlete_streams_loaded_idx").on(
      t.athlete,
      t.areStreamsLoaded,
    ),
  ],
);

export const activityStreams = pgTable(
  "activity_streams",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    seriesType: text("series_type").notNull(),
    originalSize: integer("original_size").notNull(),
    resolution: text("resolution").notNull(),
    chunkIndex: integer("chunk_index"),
    data: text("data").notNull(),
  },
  (t) => [
    index("activity_streams_activity_id_idx").on(t.activityId),
    index("activity_streams_activity_id_type_idx").on(t.activityId, t.type),
  ],
);

export const riderSettings = pgTable(
  "rider_settings",
  {
    id: serial("id").primaryKey(),
    athlete: integer("athlete").notNull(),
    cdA: real("cd_a").notNull(),
    crr: real("crr").notNull(),
    bikeWeightKg: real("bike_weight_kg"),
    initialValues: jsonb("initial_values").notNull().$type<{
      ftp: number;
      weightKg: number;
      restingHr: number;
      maxHr: number;
      lthr: number;
    }>(),
    changes: jsonb("changes").notNull().$type<
      Array<{
        id: string;
        date: string;
        ftp?: number;
        weightKg?: number;
        restingHr?: number;
        maxHr?: number;
        lthr?: number;
      }>
    >(),
  },
  (t) => [uniqueIndex("rider_settings_athlete_idx").on(t.athlete)],
);

export const syncJobs = pgTable(
  "sync_jobs",
  {
    id: serial("id").primaryKey(),
    athlete: integer("athlete").notNull(),
    status: syncJobStatusEnum("status").notNull(),
    activitiesFetched: integer("activities_fetched").notNull().default(0),
    activitiesPagesComplete: boolean("activities_pages_complete")
      .notNull()
      .default(false),
    streamsTotal: integer("streams_total").notNull().default(0),
    streamsFetched: integer("streams_fetched").notNull().default(0),
    lastError: text("last_error"),
    startedAt: real("started_at").notNull(),
  },
  (t) => [uniqueIndex("sync_jobs_athlete_idx").on(t.athlete)],
);
