import { eq } from "drizzle-orm";
import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import strava from "strava-v3";
import { z } from "zod";

import { getDB } from "~/db/getDB";

import { activitiesTable } from "../../db/schema";
import { authedProcedure, router } from "../trpc";

export const stravaRouter = router({
  activities: authedProcedure
    .input(
      z.object({ activityTypes: z.array(z.string()).optional() }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const { db, athleteId } = await getAuthContext(ctx.req);

      const activities = await db.query.activitiesTable.findMany({
        where: (activity, { eq, and, inArray }) => {
          if (input?.activityTypes?.length) {
            return and(
              eq(activity.athlete, athleteId),
              inArray(activity.type, input.activityTypes),
            );
          }

          return eq(activity.athlete, athleteId);
        },
        with: {
          map_polyline: false,
        },
      });

      return activities;
    }),
  activitiesWithMap: authedProcedure.query(async ({ ctx }) => {
    const { db, athleteId } = await getAuthContext(ctx.req);

    const activities = await db.query.activitiesTable.findMany({
      where: (activity, { eq }) => eq(activity.athlete, athleteId),
    });

    return activities;
  }),
  activityWithMap: authedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const { db, athleteId } = await getAuthContext(ctx.req);

      const activity = await db.query.activitiesTable.findFirst({
        where: (activity, { eq, and }) =>
          and(eq(activity.id, input.id), eq(activity.athlete, athleteId)),
      });

      return activity;
    }),
  activityTypes: authedProcedure.query(async ({ ctx }) => {
    const { db, athleteId } = await getAuthContext(ctx.req);

    const activityTypes = await db
      .selectDistinct({ type: activitiesTable.type })
      .from(activitiesTable)
      .where(eq(activitiesTable.athlete, athleteId));

    return activityTypes.map((activity) => activity.type).sort();
  }),
  reloadActivityFromStrava: authedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { db, athleteId, accessToken } = await getAuthContext(ctx.req);

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
  loadOlderActivitiesFromStrava: authedProcedure.mutation(async ({ ctx }) => {
    const { db, athleteId, accessToken } = await getAuthContext(ctx.req);

    const oldestActivity = await db.query.activitiesTable.findFirst({
      where: (activity, { eq }) => eq(activity.athlete, athleteId),
      orderBy: (activity, { asc }) => asc(activity.startDate),
    });

    const activities = await strava.athlete.listActivities({
      access_token: accessToken,
      per_page: 50,
      before: new Date(oldestActivity!.startDate).getTime() / 1000,
    });

    // TODO: Batch the insertions
    for await (const activity of activities) {
      const existingActivity = await db.query.activitiesTable.findFirst({
        where: (dbActivity, { eq }) => eq(dbActivity.id, activity.id),
      });

      if (existingActivity) {
        console.log(
          `Activity ${activity.id} already exists, skipping insertion`,
        );
      } else {
        console.log(`Inserting activity ${activity.id}`);
        await db
          .insert(activitiesTable)
          .values(getModelFromStravaActivity(activity));
      }
    }
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
    map_polyline: activity.map?.summary_polyline,
  };
}
