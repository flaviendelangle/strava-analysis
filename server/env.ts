import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  STRAVA_CLIENT_ID: z.string().min(1, "STRAVA_CLIENT_ID is required"),
  STRAVA_CLIENT_SECRET: z.string().min(1, "STRAVA_CLIENT_SECRET is required"),
  STRAVA_WEBHOOK_VERIFY_TOKEN: z
    .string()
    .min(1, "STRAVA_WEBHOOK_VERIFY_TOKEN is required"),
  STRAVA_WEBHOOK_CALLBACK_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
