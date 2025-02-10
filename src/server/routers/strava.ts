import { getToken } from "next-auth/jwt";
import strava from "strava-v3";
import { z } from "zod";

import { getDB } from "~/db/getDB";

import { activitiesTable } from "../../db/schema";
import { authedProcedure, router } from "../trpc";

export const stravaRouter = router({
  activities: authedProcedure.query(async ({ ctx }) => {
    const token = await getToken({
      req: ctx.req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const db = getDB();

    const activities = await db.query.activitiesTable.findMany({
      where: (activity, { eq }) => eq(activity.athlete, Number(token?.sub)),
      with: {
        map_polyline: false,
      },
    });

    return activities;
  }),
  activitiesWithMap: authedProcedure.query(async ({ ctx }) => {
    const token = await getToken({
      req: ctx.req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const db = getDB();

    const activities = await db.query.activitiesTable.findMany({
      where: (activity, { eq }) => eq(activity.athlete, Number(token?.sub)),
    });

    return activities;
  }),
  activityWithMap: authedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const token = await getToken({
        req: ctx.req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      const db = getDB();
      const activity = await db.query.activitiesTable.findFirst({
        where: (activity, { eq, and }) =>
          and(
            eq(activity.id, input.id),
            eq(activity.athlete, Number(token!.sub)),
          ),
      });

      return activity;
    }),
  loadActivities: authedProcedure.mutation(async ({ ctx }) => {
    const token = await getToken({
      req: ctx.req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const activities = await strava.athlete.listActivities({
      access_token: token!.accessToken as string,
    });

    const db = getDB();

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
        await db.insert(activitiesTable).values({
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
        });
      }
    }
  }),
});
