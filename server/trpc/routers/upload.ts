import { z } from "zod";

import { getAccessToken } from "../../lib/strava";
import {
  protectedProcedure,
  rateLimited,
  router,
  validateAthleteOwnership,
} from "../index";

export const uploadRouter = router({
  uploadToStrava: protectedProcedure
    .input(
      z.object({
        athleteId: z.number(),
        fitFileBase64: z.string().max(10 * 1024 * 1024, "File too large (max 10 MB)"),
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .use(validateAthleteOwnership)
    .use(rateLimited)
    .mutation(async ({ ctx, input }) => {
      const accessToken = await getAccessToken(ctx.db, input.athleteId);

      const fitBuffer = Buffer.from(input.fitFileBase64, "base64");

      const formData = new FormData();
      formData.append(
        "file",
        new Blob([fitBuffer], { type: "application/octet-stream" }),
        "training.fit",
      );
      formData.append("data_type", "fit");
      formData.append("trainer", "1");
      formData.append("name", input.name);
      if (input.description) {
        formData.append("description", input.description);
      }

      const response = await fetch("https://www.strava.com/api/v3/uploads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Strava upload failed: ${response.status} ${error}`);
      }

      const result = await response.json();
      return {
        uploadId: result.id as number,
        status: result.status as string,
      };
    }),

  checkUploadStatus: protectedProcedure
    .input(
      z.object({
        athleteId: z.number(),
        uploadId: z.number(),
      }),
    )
    .use(validateAthleteOwnership)
    .mutation(async ({ ctx, input }) => {
      const accessToken = await getAccessToken(ctx.db, input.athleteId);

      const response = await fetch(
        `https://www.strava.com/api/v3/uploads/${input.uploadId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        status: result.status as string,
        activityId: (result.activity_id as number) ?? null,
        error: (result.error as string) ?? null,
      };
    }),
});
