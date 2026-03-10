import { eq } from "drizzle-orm";
import strava from "strava-v3";

import { TRPCError } from "@trpc/server";

import type { Database } from "../db";
import { athletes } from "../db/schema";
import { env } from "../env";
import type { StravaActivity, StravaStream } from "./stravaTypes";

const STREAM_KEYS = [
  "time",
  "distance",
  "latlng",
  "watts",
  "altitude",
  "heartrate",
  "cadence",
  "temp",
  "velocity_smooth",
];

// Refresh 5 minutes before actual expiry to avoid race conditions
const EXPIRY_BUFFER_SECONDS = 300;

// In-flight token refresh promises keyed by athleteId.
// Prevents concurrent requests from double-consuming a refresh token.
const refreshLocks = new Map<number, Promise<string>>();

export async function getAccessToken(
  db: Database,
  athleteId: number,
): Promise<string> {
  const athlete = await db.query.athletes.findFirst({
    where: eq(athletes.stravaAthleteId, athleteId),
  });

  if (!athlete) {
    throw new Error("Athlete not found");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  // If token is still valid (with buffer), return it as-is
  if (athlete.tokenExpiresAt > nowSeconds + EXPIRY_BUFFER_SECONDS) {
    return athlete.accessToken;
  }

  // Token expired or about to expire -- needs refresh
  if (!athlete.refreshToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Strava session expired. Please sign in again.",
    });
  }

  // If another request is already refreshing this athlete's token, wait for it
  const inflight = refreshLocks.get(athleteId);
  if (inflight) {
    return inflight;
  }

  const promise = refreshToken(db, athleteId, athlete.refreshToken);
  refreshLocks.set(athleteId, promise);
  try {
    return await promise;
  } finally {
    refreshLocks.delete(athleteId);
  }
}

async function refreshToken(
  db: Database,
  athleteId: number,
  refreshToken: string,
): Promise<string> {
  const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Strava token refresh failed. Please sign in again.",
    });
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  // Persist the new tokens
  await db
    .update(athletes)
    .set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: data.expires_at,
    })
    .where(eq(athletes.stravaAthleteId, athleteId));

  return data.access_token;
}

export function getModelFromStravaActivity(activity: StravaActivity) {
  return {
    stravaId: activity.id,
    athlete: activity.athlete.id,
    type: activity.type,
    name: activity.name,
    startDate: activity.start_date,
    startDateLocal: activity.start_date_local,
    distance: activity.distance,
    totalElevationGain: activity.total_elevation_gain,
    averageSpeed: activity.average_speed,
    averageWatts: activity.average_watts ?? undefined,
    averageCadence: activity.average_cadence ?? undefined,
    averageHeartrate: activity.average_heartrate ?? undefined,
    maxHeartrate: activity.max_heartrate ?? undefined,
    maxSpeed: activity.max_speed ?? undefined,
    maxWatts: activity.max_watts ?? undefined,
    weightedAverageWatts: activity.weighted_average_watts ?? undefined,
    kilojoules: activity.kilojoules ?? undefined,
    calories: activity.calories ?? undefined,
    movingTime: activity.moving_time,
    elapsedTime: activity.elapsed_time,
    workoutType: activity.workout_type ?? undefined,
    mapPolyline: activity.map?.summary_polyline ?? undefined,
  };
}

export function normalizeStreams(
  streams: StravaStream[] | Record<string, StravaStream> | unknown,
): {
  type: string;
  seriesType: string;
  originalSize: number;
  resolution: string;
  data: number[];
}[] {
  if (Array.isArray(streams)) {
    return (streams as StravaStream[]).map((s) => ({
      type: s.type,
      seriesType: s.series_type,
      originalSize: s.original_size,
      resolution: s.resolution,
      data: s.data,
    }));
  }

  if (streams && typeof streams === "object") {
    return Object.entries(streams as Record<string, StravaStream>).map(
      ([type, s]) => ({
        type,
        seriesType: s.series_type,
        originalSize: s.original_size,
        resolution: s.resolution,
        data: s.data,
      }),
    );
  }

  return [];
}

export async function fetchStreamsFromStrava(
  accessToken: string,
  stravaId: number,
): Promise<ReturnType<typeof normalizeStreams>> {
  const streams = await strava.streams.activity({
    access_token: accessToken,
    id: String(stravaId),
    keys: STREAM_KEYS.join(",") as unknown as string[],
    key_by_type: true,
  });

  return streams ? normalizeStreams(streams) : [];
}
