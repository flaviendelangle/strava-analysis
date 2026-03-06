CREATE TABLE "time_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"athlete" integer NOT NULL,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"sport_types" jsonb
);
--> statement-breakpoint
CREATE INDEX "time_periods_athlete_idx" ON "time_periods" USING btree ("athlete");