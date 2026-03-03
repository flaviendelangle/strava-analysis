import { eq } from "drizzle-orm";
import { z } from "zod";

import { riderSettings } from "../../db/schema";
import { recomputeAllScores } from "../../lib/sync";
import {
  protectedProcedure,
  router,
  validateAthleteOwnership,
} from "../index";

const changePointSchema = z.object({
  id: z.string(),
  date: z.string(),
  ftp: z.number().optional(),
  weightKg: z.number().optional(),
  restingHr: z.number().optional(),
  maxHr: z.number().optional(),
  lthr: z.number().optional(),
});

const initialValuesSchema = z.object({
  ftp: z.number(),
  weightKg: z.number(),
  restingHr: z.number(),
  maxHr: z.number(),
  lthr: z.number(),
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
        cdA: z.number(),
        crr: z.number(),
        bikeWeightKg: z.number(),
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
