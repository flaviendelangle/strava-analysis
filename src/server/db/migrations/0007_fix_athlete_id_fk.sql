-- Migrate athlete columns from Strava athlete IDs to DB serial IDs.
-- Previously, activities.athlete, rider_settings.athlete, sync_jobs.athlete,
-- and time_periods.athlete stored the Strava external ID instead of the
-- athletes.id serial primary key.

-- Update activities.athlete: map strava_athlete_id -> athletes.id
UPDATE activities
SET athlete = a.id
FROM athletes a
WHERE activities.athlete = a.strava_athlete_id;

-- Update rider_settings.athlete
UPDATE rider_settings
SET athlete = a.id
FROM athletes a
WHERE rider_settings.athlete = a.strava_athlete_id;

-- Update sync_jobs.athlete
UPDATE sync_jobs
SET athlete = a.id
FROM athletes a
WHERE sync_jobs.athlete = a.strava_athlete_id;

-- Update time_periods.athlete
UPDATE time_periods
SET athlete = a.id
FROM athletes a
WHERE time_periods.athlete = a.strava_athlete_id;

-- Fix startedAt column: change from real (32-bit float, loses precision)
-- to bigint (can store millisecond timestamps accurately)
ALTER TABLE sync_jobs ALTER COLUMN started_at TYPE bigint USING started_at::bigint;

-- Add stream fetch retry counter to avoid permanently marking activities
-- as loaded after a single stream fetch failure
ALTER TABLE activities ADD COLUMN stream_fetch_attempts integer NOT NULL DEFAULT 0;
