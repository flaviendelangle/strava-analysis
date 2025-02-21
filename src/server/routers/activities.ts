import { eq } from "drizzle-orm";
import strava from "strava-v3";
import { ac } from "vitest/dist/chunks/reporters.nr4dxCkA.js";
import { z } from "zod";

import { activitiesTable } from "../../db/schema";
import { authedProcedure, router } from "../trpc";
import { getAuthContext } from "../utils";

export const activitiesRouter = router({
  listActivitiesWithoutMap: authedProcedure
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
  listActivitiesWithMap: authedProcedure
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
      });

      return activities;
    }),
  getActivityWithMap: authedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const { db, athleteId } = await getAuthContext(ctx.req);

      const activity = await db.query.activitiesTable.findFirst({
        where: (activity, { eq, and }) =>
          and(eq(activity.id, input.id), eq(activity.athlete, athleteId)),
      });

      return activity;
    }),
  getActivityStreams: authedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const { db, accessToken } = await getAuthContext(ctx.req);

      const activity = await strava.streams.activity({
        access_token: accessToken,
        id: input.id,
        types: [
          "distance",
          "watts",
          // "altitude",
          "heartrate",
          "cadence",
          // "temp",
          "velocity_smooth",
        ],
        key_by_type: true,
      });

      if (!activity) {
        throw new Error(`Activity ${input.id} not found on Strava`);
      }

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
});
