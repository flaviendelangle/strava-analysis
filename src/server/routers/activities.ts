import { eq } from "drizzle-orm";
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
  activityTypes: authedProcedure.query(async ({ ctx }) => {
    const { db, athleteId } = await getAuthContext(ctx.req);

    const activityTypes = await db
      .selectDistinct({ type: activitiesTable.type })
      .from(activitiesTable)
      .where(eq(activitiesTable.athlete, athleteId));

    return activityTypes.map((activity) => activity.type).sort();
  }),
});
