import { and, eq, getTableColumns, inArray } from "drizzle-orm";
import { z } from "zod";

import { activities } from "../../db/schema";
import {
  protectedProcedure,
  router,
  validateAthleteOwnership,
} from "../index";

export const activitiesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        athleteId: z.number(),
        activityTypes: z.array(z.string()).optional(),
        includeMap: z.boolean().optional(),
      }),
    )
    .use(validateAthleteOwnership)
    .query(async ({ ctx, input }) => {
      // Build filter conditions
      const conditions = [eq(activities.athlete, input.athleteId)];
      if (input.activityTypes && input.activityTypes.length > 0) {
        conditions.push(inArray(activities.type, input.activityTypes));
      }

      // Run both queries in parallel
      const allTypesPromise = ctx.db
        .selectDistinct({ type: activities.type })
        .from(activities)
        .where(eq(activities.athlete, input.athleteId))
        .then((rows) => rows.map((r) => r.type).sort());

      if (input.includeMap) {
        const [filtered, allTypes] = await Promise.all([
          ctx.db.select().from(activities).where(and(...conditions)),
          allTypesPromise,
        ]);
        return { activities: filtered, allTypes };
      }

      // Exclude mapPolyline at query level when not needed
      const { mapPolyline: _mapPolyline, ...columnsWithoutMap } =
        getTableColumns(activities);

      const [filtered, allTypes] = await Promise.all([
        ctx.db
          .select(columnsWithoutMap)
          .from(activities)
          .where(and(...conditions)),
        allTypesPromise,
      ]);

      return {
        activities: filtered.map((a) => ({
          ...a,
          mapPolyline: null as string | null,
        })),
        allTypes,
      };
    }),

  get: protectedProcedure
    .input(z.object({ stravaId: z.number() }))
    .query(async ({ ctx, input }) => {
      return (
        (await ctx.db.query.activities.findFirst({
          where: and(
            eq(activities.stravaId, input.stravaId),
            eq(activities.athlete, ctx.session.athleteId),
          ),
        })) ?? null
      );
    }),
});
