import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { activities, timePeriods } from "../../db/schema";
import { protectedProcedure, router, validateAthleteOwnership } from "../index";

export const timePeriodsRouter = router({
  list: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .use(validateAthleteOwnership)
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(timePeriods)
        .where(eq(timePeriods.athlete, input.athleteId))
        .orderBy(timePeriods.startDate);
    }),

  create: protectedProcedure
    .input(
      z
        .object({
          athleteId: z.number(),
          name: z.string().min(1),
          startDate: z.string().date(),
          endDate: z.string().date(),
          sportTypes: z.array(z.string()).nullable().optional(),
        })
        .refine((d) => d.startDate <= d.endDate, {
          message: "startDate must be before or equal to endDate",
        }),
    )
    .use(validateAthleteOwnership)
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(timePeriods)
        .values({
          athlete: input.athleteId,
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          sportTypes: input.sportTypes ?? null,
        })
        .returning();
      return row;
    }),

  update: protectedProcedure
    .input(
      z
        .object({
          athleteId: z.number(),
          id: z.number(),
          name: z.string().min(1),
          startDate: z.string().date(),
          endDate: z.string().date(),
          sportTypes: z.array(z.string()).nullable().optional(),
        })
        .refine((d) => d.startDate <= d.endDate, {
          message: "startDate must be before or equal to endDate",
        }),
    )
    .use(validateAthleteOwnership)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(timePeriods)
        .set({
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          sportTypes: input.sportTypes ?? null,
        })
        .where(
          and(
            eq(timePeriods.id, input.id),
            eq(timePeriods.athlete, input.athleteId),
          ),
        );
    }),

  delete: protectedProcedure
    .input(z.object({ athleteId: z.number(), id: z.number() }))
    .use(validateAthleteOwnership)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(timePeriods)
        .where(
          and(
            eq(timePeriods.id, input.id),
            eq(timePeriods.athlete, input.athleteId),
          ),
        );
    }),

  getStats: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .use(validateAthleteOwnership)
    .query(async ({ ctx, input }) => {
      const periods = await ctx.db
        .select()
        .from(timePeriods)
        .where(eq(timePeriods.athlete, input.athleteId))
        .orderBy(timePeriods.startDate);

      if (periods.length === 0) return [];

      const results = await Promise.all(
        periods.map(async (period) => {
          const sportFilter =
            period.sportTypes && period.sportTypes.length > 0
              ? sql`AND ${activities.type} IN (${sql.join(
                  period.sportTypes.map((t) => sql`${t}`),
                  sql`, `,
                )})`
              : sql``;

          const rows = await ctx.db.execute<{
            activity_count: string;
            total_moving_time: string;
            total_elapsed_time: string;
            total_distance: string;
            total_elevation: string;
            total_calories: string;
          }>(sql`
            SELECT
              COUNT(*)::text AS activity_count,
              COALESCE(SUM(${activities.movingTime}), 0)::text AS total_moving_time,
              COALESCE(SUM(${activities.elapsedTime}), 0)::text AS total_elapsed_time,
              COALESCE(SUM(${activities.distance}), 0)::text AS total_distance,
              COALESCE(SUM(${activities.totalElevationGain}), 0)::text AS total_elevation,
              COALESCE(SUM(${activities.calories}), 0)::text AS total_calories
            FROM ${activities}
            WHERE ${activities.athlete} = ${input.athleteId}
              AND ${activities.startDate} >= ${period.startDate}
              AND ${activities.startDate} <= ${period.endDate + "T23:59:59Z"}
              ${sportFilter}
          `);

          const row = rows[0];
          return {
            period,
            activityCount: Number(row.activity_count),
            totalMovingTime: Number(row.total_moving_time),
            totalElapsedTime: Number(row.total_elapsed_time),
            totalDistance: Number(row.total_distance),
            totalElevation: Number(row.total_elevation),
            totalCalories: Number(row.total_calories),
          };
        }),
      );

      return results;
    }),
});
