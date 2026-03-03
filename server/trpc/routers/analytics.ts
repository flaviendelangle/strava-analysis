import { sql } from "drizzle-orm";
import { z } from "zod";

import {
  protectedProcedure,
  router,
  validateAthleteOwnership,
} from "../index";

export const analyticsRouter = router({
  getPowerCurve: protectedProcedure
    .input(
      z.object({
        athleteId: z.number(),
        activityTypes: z.array(z.string()).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
    )
    .use(validateAthleteOwnership)
    .query(async ({ ctx, input }) => {
      const typeFilter =
        input.activityTypes && input.activityTypes.length > 0
          ? sql`AND a.type IN (${sql.join(input.activityTypes.map((t) => sql`${t}`), sql`, `)})`
          : sql``;

      const dateFromFilter = input.dateFrom
        ? sql`AND a.start_date >= ${input.dateFrom}`
        : sql``;

      const dateToFilter = input.dateTo
        ? sql`AND a.start_date <= ${input.dateTo}`
        : sql``;

      const rows = await ctx.db.execute<{
        duration: string;
        watts: string;
        activity_strava_id: string;
        activity_name: string;
      }>(sql`
        WITH unnested AS (
          SELECT
            a.strava_id,
            a.name,
            (kv.key)::int AS duration,
            (kv.value)::int AS watts
          FROM activities a,
          LATERAL jsonb_each_text(a.power_bests) AS kv(key, value)
          WHERE a.athlete = ${input.athleteId}
            AND a.power_bests IS NOT NULL
            ${typeFilter}
            ${dateFromFilter}
            ${dateToFilter}
        ),
        ranked AS (
          SELECT
            strava_id,
            name,
            duration,
            watts,
            ROW_NUMBER() OVER (PARTITION BY duration ORDER BY watts DESC) AS rn
          FROM unnested
        )
        SELECT
          duration,
          watts,
          strava_id AS activity_strava_id,
          name AS activity_name
        FROM ranked
        WHERE rn = 1
        ORDER BY duration
      `);

      return rows.map((row) => ({
        duration: Number(row.duration),
        watts: Number(row.watts),
        activityStravaId: Number(row.activity_strava_id),
        activityName: String(row.activity_name),
      }));
    }),

  getPowerCurveYears: protectedProcedure
    .input(
      z.object({
        athleteId: z.number(),
        activityTypes: z.array(z.string()).optional(),
      }),
    )
    .use(validateAthleteOwnership)
    .query(async ({ ctx, input }) => {
      const typeFilter =
        input.activityTypes && input.activityTypes.length > 0
          ? sql`AND a.type IN (${sql.join(input.activityTypes.map((t) => sql`${t}`), sql`, `)})`
          : sql``;

      const rows = await ctx.db.execute<{ year: string }>(sql`
        SELECT DISTINCT EXTRACT(YEAR FROM a.start_date::timestamp)::int AS year
        FROM activities a
        WHERE a.athlete = ${input.athleteId}
          AND a.power_bests IS NOT NULL
          ${typeFilter}
        ORDER BY year DESC
      `);

      return rows.map((row) => Number(row.year));
    }),
});
