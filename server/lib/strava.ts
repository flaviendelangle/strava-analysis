import { eq } from "drizzle-orm";
import strava from "strava-v3";

import type { Database } from "../db";
import { athletes } from "../db/schema";
import type { StravaActivity, StravaStream } from "./stravaTypes";

const STREAM_KEYS = [
  "distance",
  "watts",
  "altitude",
  "heartrate",
  "cadence",
  "temp",
  "velocity_smooth",
];

export async function getAccessToken(
  db: Database,
  athleteId: number,
): Promise<string> {
  const athlete = await db.query.athletes.findFirst({
    where: eq(athletes.stravaAthleteId, athleteId),
  });

  if (!athlete) {
    throw new Error(`Athlete ${athleteId} not found`);
  }

  return athlete.accessToken;
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
