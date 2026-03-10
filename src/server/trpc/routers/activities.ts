import { and, eq, getTableColumns, gte, inArray, isNotNull, lte } from "drizzle-orm";
import { z } from "zod";

import { activities, timePeriods } from "../../db/schema";
import { protectedProcedure, router, validateAthleteOwnership } from "../index";

export const activitiesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        athleteId: z.number(),
        activityTypes: z.array(z.string()).optional(),
        workoutTypes: z.array(z.number()).optional(),
        includeMap: z.boolean().optional(),
        timePeriodId: z.number().optional(),
      }),
    )
    .use(validateAthleteOwnership)
    .query(async ({ ctx, input }) => {
      // Resolve time period constraints if selected
      let periodDateFrom: string | undefined;
      let periodDateTo: string | undefined;
      let periodSportTypes: string[] | undefined;
      if (input.timePeriodId) {
        const period = await ctx.db.query.timePeriods.findFirst({
          where: and(
            eq(timePeriods.id, input.timePeriodId),
            eq(timePeriods.athlete, input.athleteId),
          ),
        });
        if (period) {
          periodDateFrom = period.startDate;
          periodDateTo = period.endDate;
          if (period.sportTypes && period.sportTypes.length > 0) {
            periodSportTypes = period.sportTypes;
          }
        }
      }

      // Build filter conditions
      const conditions = [eq(activities.athlete, input.athleteId)];
      if (input.activityTypes && input.activityTypes.length > 0) {
        conditions.push(inArray(activities.type, input.activityTypes));
      }
      if (periodSportTypes) {
        conditions.push(inArray(activities.type, periodSportTypes));
      }
      if (input.workoutTypes && input.workoutTypes.length > 0) {
        conditions.push(inArray(activities.workoutType, input.workoutTypes));
      }
      if (periodDateFrom) {
        conditions.push(gte(activities.startDate, periodDateFrom));
      }
      if (periodDateTo) {
        conditions.push(lte(activities.startDate, periodDateTo + "T23:59:59Z"));
      }

      // Run both queries in parallel
      const allTypesPromise = ctx.db
        .selectDistinct({ type: activities.type })
        .from(activities)
        .where(eq(activities.athlete, input.athleteId))
        .then((rows) => rows.map((r) => r.type).sort());

      const allWorkoutTypesPromise = ctx.db
        .selectDistinct({ workoutType: activities.workoutType })
        .from(activities)
        .where(and(eq(activities.athlete, input.athleteId), isNotNull(activities.workoutType)))
        .then((rows) => rows.map((r) => r.workoutType!).sort((a, b) => a - b));

      if (input.includeMap) {
        const [filtered, allTypes, allWorkoutTypes] = await Promise.all([
          ctx.db
            .select()
            .from(activities)
            .where(and(...conditions)),
          allTypesPromise,
          allWorkoutTypesPromise,
        ]);
        return { activities: filtered, allTypes, allWorkoutTypes };
      }

      // Exclude mapPolyline at query level when not needed
      const { mapPolyline: _mapPolyline, ...columnsWithoutMap } =
        getTableColumns(activities);

      const [filtered, allTypes, allWorkoutTypes] = await Promise.all([
        ctx.db
          .select(columnsWithoutMap)
          .from(activities)
          .where(and(...conditions)),
        allTypesPromise,
        allWorkoutTypesPromise,
      ]);

      return {
        activities: filtered.map((a) => ({
          ...a,
          mapPolyline: null as string | null,
        })),
        allTypes,
        allWorkoutTypes,
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
