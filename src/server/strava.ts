import { eq } from "drizzle-orm";
import strava from "strava-v3";

import { Database } from "~/db/getDB";
import { activitiesTable, activityStreamTable } from "~/db/schema";

export async function fetchAndStoreActivityStreams(
  activityId: number,
  db: Database,
  accessToken: string,
) {
  const activityStreamsFromStrava = await strava.streams.activity({
    access_token: accessToken,
    id: activityId,
    types: [
      "distance",
      "watts",
      "altitude",
      "heartrate",
      "cadence",
      "temp",
      "velocity_smooth",
    ],
    key_by_type: true,
  });

  if (!activityStreamsFromStrava) {
    throw new Error(`Activity ${activityId} not found on Strava`);
  }

  const activityStreamsFromDb = await db
    .insert(activityStreamTable)
    .values(
      activityStreamsFromStrava.map((stream: any) => ({
        activity: activityId,
        type: stream.type,
        seriesType: stream.series_type,
        originalSize: stream.original_size,
        resolution: stream.resolution,
        data: stream.data,
      })),
    )
    .returning();

  await db
    .update(activitiesTable)
    .set({ areStreamsLoaded: true })
    .where(eq(activitiesTable.id, activityId));

  return activityStreamsFromDb;
}
