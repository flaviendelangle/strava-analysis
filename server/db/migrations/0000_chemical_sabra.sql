CREATE TYPE "public"."sync_job_status" AS ENUM('fetching_activities', 'fetching_streams', 'computing_scores', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"strava_id" bigint NOT NULL,
	"athlete" integer NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"start_date_local" text NOT NULL,
	"distance" real NOT NULL,
	"total_elevation_gain" real NOT NULL,
	"average_speed" real NOT NULL,
	"average_watts" real,
	"average_cadence" real,
	"average_heartrate" real,
	"max_heartrate" real,
	"max_speed" real,
	"max_watts" real,
	"weighted_average_watts" real,
	"kilojoules" real,
	"calories" real,
	"moving_time" integer NOT NULL,
	"elapsed_time" integer NOT NULL,
	"map_polyline" text,
	"are_streams_loaded" boolean DEFAULT false NOT NULL,
	"hrss" real,
	"tss" real,
	"power_bests" jsonb
);
--> statement-breakpoint
CREATE TABLE "activity_streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"type" text NOT NULL,
	"series_type" text NOT NULL,
	"original_size" integer NOT NULL,
	"resolution" text NOT NULL,
	"chunk_index" integer,
	"data" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athletes" (
	"id" serial PRIMARY KEY NOT NULL,
	"strava_athlete_id" bigint NOT NULL,
	"access_token" text NOT NULL,
	"name" text
);
--> statement-breakpoint
CREATE TABLE "rider_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"athlete" integer NOT NULL,
	"cd_a" real NOT NULL,
	"crr" real NOT NULL,
	"bike_weight_kg" real,
	"initial_values" jsonb NOT NULL,
	"changes" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"athlete" integer NOT NULL,
	"status" "sync_job_status" NOT NULL,
	"activities_fetched" integer DEFAULT 0 NOT NULL,
	"activities_pages_complete" boolean DEFAULT false NOT NULL,
	"streams_total" integer DEFAULT 0 NOT NULL,
	"streams_fetched" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"started_at" real NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_streams" ADD CONSTRAINT "activity_streams_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_strava_id_idx" ON "activities" USING btree ("strava_id");--> statement-breakpoint
CREATE INDEX "activities_athlete_idx" ON "activities" USING btree ("athlete");--> statement-breakpoint
CREATE INDEX "activities_athlete_start_date_idx" ON "activities" USING btree ("athlete","start_date");--> statement-breakpoint
CREATE INDEX "activity_streams_activity_id_idx" ON "activity_streams" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_streams_activity_id_type_idx" ON "activity_streams" USING btree ("activity_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "athletes_strava_id_idx" ON "athletes" USING btree ("strava_athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rider_settings_athlete_idx" ON "rider_settings" USING btree ("athlete");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_jobs_athlete_idx" ON "sync_jobs" USING btree ("athlete");