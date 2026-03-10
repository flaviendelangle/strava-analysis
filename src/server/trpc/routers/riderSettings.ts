import { eq } from "drizzle-orm";
import { z } from "zod";

import { riderSettings } from "../../db/schema";
import { recomputeAllScores } from "../../lib/sync";
import { protectedProcedure, router, validateAthleteOwnership } from "../index";

const changePointSchema = z.object({
  id: z.string(),
  date: z.string(),
  ftp: z.number().positive().max(2000).optional(),
  weightKg: z.number().positive().max(500).optional(),
  restingHr: z.number().int().positive().max(200).optional(),
  maxHr: z.number().int().positive().max(250).optional(),
  lthr: z.number().int().positive().max(250).optional(),
});

const initialValuesSchema = z.object({
  ftp: z.number().positive().max(2000),
  weightKg: z.number().positive().max(500),
  restingHr: z.number().int().positive().max(200),
  maxHr: z.number().int().positive().max(250),
  lthr: z.number().int().positive().max(250),
});

export const riderSettingsRouter = router({
  get: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .use(validateAthleteOwnership)
    .query(async ({ ctx, input }) => {
      return (
        (await ctx.db.query.riderSettings.findFirst({
          where: eq(riderSettings.athlete, input.athleteId),
        })) ?? null
      );
    }),

  save: protectedProcedure
    .input(
      z.object({
        athleteId: z.number(),
        cdA: z.number().positive().max(2),
        crr: z.number().positive().max(1),
        bikeWeightKg: z.number().positive().max(50),
        initialValues: initialValuesSchema,
        changes: z.array(changePointSchema),
      }),
    )
    .use(validateAthleteOwnership)
    .mutation(async ({ ctx, input }) => {
      const { athleteId, ...data } = input;

      // Ensure changes are sorted by date
      data.changes = [...data.changes].sort((a, b) =>
        a.date.localeCompare(b.date),
      );

      const existing = await ctx.db.query.riderSettings.findFirst({
        where: eq(riderSettings.athlete, athleteId),
      });

      if (existing) {
        await ctx.db
          .update(riderSettings)
          .set(data)
          .where(eq(riderSettings.id, existing.id));
      } else {
        await ctx.db.insert(riderSettings).values({
          athlete: athleteId,
          ...data,
        });
      }

      // Fire-and-forget recomputation
      recomputeAllScores(ctx.db, athleteId).catch((err) =>
        console.error("[recomputeAllScores] Error:", err),
      );
    }),

  recomputeScores: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .use(validateAthleteOwnership)
    .mutation(async ({ ctx, input }) => {
      await recomputeAllScores(ctx.db, input.athleteId);
    }),
});
