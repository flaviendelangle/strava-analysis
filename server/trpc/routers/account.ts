import { z } from "zod";

import { deleteAllAthleteData } from "../../lib/webhook";
import { protectedProcedure, router, validateAthleteOwnership } from "../index";

export const accountRouter = router({
  deleteAllData: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .use(validateAthleteOwnership)
    .mutation(async ({ ctx, input }) => {
      await deleteAllAthleteData(ctx.db, input.athleteId);
    }),
});
