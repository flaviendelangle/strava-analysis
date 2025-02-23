import { eq } from "drizzle-orm";
import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import strava from "strava-v3";
import { z } from "zod";

import { Database, getDB } from "~/db/getDB";

import { activitiesTable } from "../../db/schema";
import { authedProcedure, router } from "../trpc";

const PAGE_SIZE = 50;

export const stravaRouter = router({
  reloadActivity: authedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { db, accessToken } = await getAuthContext(ctx.req);

      const activity = await strava.activities.get({
        access_token: accessToken,
        id: input.id,
      });

      if (!activity) {
        throw new Error(`Activity ${input.id} not found on Strava`);
      }

      console.log(`Updating activity ${activity.id}`);
      await db
        .update(activitiesTable)
        .set(getModelFromStravaActivity(activity))
        .where(eq(activitiesTable.id, input.id));
    }),
  checkForNewActivities: authedProcedure.mutation(async ({ ctx }) => {
    const { db, athleteId, accessToken } = await getAuthContext(ctx.req);

    const latestActivity = await db.query.activitiesTable.findFirst({
      where: (activity, { eq }) => eq(activity.athlete, athleteId),
      orderBy: (activity, { desc }) => desc(activity.startDate),
    });

    let activities: any[] = [];
    if (latestActivity) {
      let page = 1;

      while (page < 10) {
        const pageActivities = await strava.athlete.listActivities({
          access_token: accessToken,
          page_size: PAGE_SIZE,
          after: new Date(latestActivity.startDate).getTime() / 1000,
        });

        activities.push(...pageActivities);

        page += 1;

        if (pageActivities.length < PAGE_SIZE) {
          break;
        }
      }
    } else {
      activities = await strava.athlete.listActivities({
        access_token: accessToken,
        per_page: PAGE_SIZE,
      });
    }

    // TODO: Batch the insertions
    await Promise.all(
      activities.map((activity) => insertNewActivities(activity, db)),
    );
  }),
  loadOlderActivities: authedProcedure.mutation(async ({ ctx }) => {
    const { db, athleteId, accessToken } = await getAuthContext(ctx.req);

    const oldestActivity = await db.query.activitiesTable.findFirst({
      where: (activity, { eq }) => eq(activity.athlete, athleteId),
      orderBy: (activity, { asc }) => asc(activity.startDate),
    });

    const activities: any[] = await strava.athlete.listActivities({
      access_token: accessToken,
      per_page: PAGE_SIZE,
      ...(oldestActivity && {
        before: new Date(oldestActivity.startDate).getTime() / 1000,
      }),
    });

    // TODO: Batch the insertions
    await Promise.all(
      activities.map((activity) => insertNewActivities(activity, db)),
    );
  }),
});

async function getAuthContext(req: NextApiRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    throw new Error("No token found");
  }

  const db = getDB();

  return {
    athleteId: Number(token.sub),
    accessToken: token.accessToken as string,
    db,
  };
}

function getModelFromStravaActivity(activity: any) {
  return {
    // General information
    id: activity.id,
    athlete: activity.athlete.id,
    type: activity.type,
    name: activity.name,
    startDate: activity.start_date,
    startDateLocal: activity.start_date_local,

    // Metrics
    distance: activity.distance,
    totalElevationGain: activity.total_elevation_gain,
    averageSpeed: activity.average_speed,
    averageWatts: activity.average_watts,
    averageCadence: activity.average_cadence,
    movingTime: activity.moving_time,
    elapsedTime: activity.elapsed_time,

    // Map data
    mapPolyline: activity.map?.summary_polyline,
    areStreamsLoaded: false,
  };
}

async function insertNewActivities(activity: any, db: Database) {
  const existingActivity = await db.query.activitiesTable.findFirst({
    where: (dbActivity, { eq }) => eq(dbActivity.id, activity.id),
  });

  if (existingActivity) {
    console.log(`Activity ${activity.id} already exists, skipping insertion`);
  } else {
    console.log(`Inserting activity ${activity.id}`);
    await db
      .insert(activitiesTable)
      .values(getModelFromStravaActivity(activity));
  }
}
