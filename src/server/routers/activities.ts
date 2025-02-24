import { eq } from "drizzle-orm";
import strava from "strava-v3";
import { z } from "zod";

import { activitiesTable, activityStreamTable } from "../../db/schema";
import { fetchAndStoreActivityStreams } from "../strava";
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
          mapPolyline: false,
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

      const response = await db
        .select({ areStreamsLoaded: activitiesTable.areStreamsLoaded })
        .from(activitiesTable)
        .where(eq(activitiesTable.id, input.id));

      if (!response[0]) {
        throw new Error(`Activity ${input.id} not found in the database`);
      }

      if (response[0].areStreamsLoaded) {
        const activityStreamsFromDb = await db
          .select({
            type: activityStreamTable.type,
            data: activityStreamTable.data,
          })
          .from(activityStreamTable)
          .where(eq(activityStreamTable.activity, input.id));

        return activityStreamsFromDb;
      }

      return fetchAndStoreActivityStreams(input.id, db, accessToken);
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
