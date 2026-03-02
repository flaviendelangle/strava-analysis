"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { getAccessToken } from "./helpers";

export const uploadToStrava = action({
  args: {
    athleteId: v.number(),
    fitFileBase64: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const accessToken = await getAccessToken(ctx, args.athleteId);

    const fitBuffer = Buffer.from(args.fitFileBase64, "base64");

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([fitBuffer], { type: "application/octet-stream" }),
      "training.fit",
    );
    formData.append("data_type", "fit");
    formData.append("trainer", "1");
    formData.append("name", args.name);
    if (args.description) {
      formData.append("description", args.description);
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
  },
});

export const checkUploadStatus = action({
  args: {
    athleteId: v.number(),
    uploadId: v.number(),
  },
  handler: async (ctx, args) => {
    const accessToken = await getAccessToken(ctx, args.athleteId);

    const response = await fetch(
      `https://www.strava.com/api/v3/uploads/${args.uploadId}`,
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
  },
});
