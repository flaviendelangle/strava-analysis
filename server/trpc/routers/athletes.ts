import { eq } from "drizzle-orm";
import { z } from "zod";

import { athletes } from "../../db/schema";
import { protectedProcedure, router } from "../index";

export const athletesRouter = router({
  upsert: protectedProcedure
    .input(
      z.object({
        stravaAthleteId: z.number(),
        accessToken: z.string(),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.athletes.findFirst({
        where: eq(athletes.stravaAthleteId, input.stravaAthleteId),
      });

      if (existing) {
        await ctx.db
          .update(athletes)
          .set({
            accessToken: input.accessToken,
            name: input.name,
          })
          .where(eq(athletes.id, existing.id));
      } else {
        await ctx.db.insert(athletes).values({
          stravaAthleteId: input.stravaAthleteId,
          accessToken: input.accessToken,
          name: input.name,
        });
      }
    }),
});
