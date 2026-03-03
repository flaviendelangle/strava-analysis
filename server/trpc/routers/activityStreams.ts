import { eq } from "drizzle-orm";
import strava from "strava-v3";
import { z } from "zod";

import { activities, activityStreams, riderSettings } from "../../db/schema";
import { computeActivityScoresInternal, storeStreams } from "../../lib/sync";
import {
  fetchStreamsFromStrava,
  getAccessToken,
  getModelFromStravaActivity,
} from "../../lib/strava";
import {
  protectedProcedure,
  router,
  validateAthleteOwnership,
} from "../index";

const USABLE_TYPES = new Set([
  "heartrate",
  "watts",
  "cadence",
  "velocity_smooth",
  "altitude",
  "distance",
]);

export const activityStreamsRouter = router({
  getStreams: protectedProcedure
    .input(z.object({ stravaId: z.number() }))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.db.query.activities.findFirst({
        where: eq(activities.stravaId, input.stravaId),
      });

      if (!activity) {
        throw new Error(
          `Activity with stravaId ${input.stravaId} not found`,
        );
      }

      if (!activity.areStreamsLoaded) {
        return null;
      }

      const streams = await ctx.db
        .select()
        .from(activityStreams)
        .where(eq(activityStreams.activityId, activity.id));

      // Group by type and merge chunks
      const grouped = new Map<string, string[]>();
      for (const s of streams) {
        if (!USABLE_TYPES.has(s.type)) continue;
        const existing = grouped.get(s.type);
        if (existing) {
          existing.push(s.data);
        } else {
          grouped.set(s.type, [s.data]);
        }
      }

      if (grouped.size === 0) {
        return null;
      }

      return Array.from(grouped, ([type, chunks]) => ({
        type,
        data:
          chunks.length === 1
            ? chunks[0]
            : JSON.stringify(
                chunks.flatMap((c) => JSON.parse(c) as number[]),
              ),
      }));
    }),

  reload: protectedProcedure
    .input(
      z.object({
        stravaId: z.number(),
        athleteId: z.number(),
      }),
    )
    .use(validateAthleteOwnership)
    .mutation(async ({ ctx, input }) => {
      const accessToken = await getAccessToken(ctx.db, input.athleteId);

      // Fetch fresh data before deleting
      const [rawActivity, normalized] = await Promise.all([
        strava.activities.get({
          access_token: accessToken,
          id: String(input.stravaId),
        }),
        fetchStreamsFromStrava(accessToken, input.stravaId),
      ]);

      if (!rawActivity) {
        throw new Error(
          `Activity ${input.stravaId} not found on Strava`,
        );
      }

      const activity = await ctx.db.query.activities.findFirst({
        where: eq(activities.stravaId, input.stravaId),
      });

      if (!activity) {
        throw new Error(
          `Activity with stravaId ${input.stravaId} not found locally`,
        );
      }

      // Update activity metadata
      const model = getModelFromStravaActivity(rawActivity);
      await ctx.db
        .update(activities)
        .set({
          type: model.type,
          name: model.name,
          startDate: model.startDate,
          startDateLocal: model.startDateLocal,
          distance: model.distance,
          totalElevationGain: model.totalElevationGain,
          averageSpeed: model.averageSpeed,
          averageWatts: model.averageWatts,
          averageCadence: model.averageCadence,
          averageHeartrate: model.averageHeartrate,
          maxHeartrate: model.maxHeartrate,
          maxSpeed: model.maxSpeed,
          maxWatts: model.maxWatts,
          weightedAverageWatts: model.weightedAverageWatts,
          kilojoules: model.kilojoules,
          calories: model.calories,
          movingTime: model.movingTime,
          elapsedTime: model.elapsedTime,
          mapPolyline: model.mapPolyline,
          areStreamsLoaded: false,
        })
        .where(eq(activities.id, activity.id));

      // Store new streams and re-compute scores
      await storeStreams(ctx.db, activity.id, normalized);

      const settingsDoc = await ctx.db.query.riderSettings.findFirst({
        where: eq(riderSettings.athlete, input.athleteId),
      });
      if (settingsDoc) {
        // Re-read the activity after storeStreams marked areStreamsLoaded = true
        const updatedActivity = await ctx.db.query.activities.findFirst({
          where: eq(activities.id, activity.id),
        });
        if (updatedActivity) {
          await computeActivityScoresInternal(ctx.db, updatedActivity, settingsDoc);
        }
      }
    }),

  fetchStreams: protectedProcedure
    .input(
      z.object({
        stravaId: z.number(),
        athleteId: z.number(),
      }),
    )
    .use(validateAthleteOwnership)
    .mutation(async ({ ctx, input }) => {
      const accessToken = await getAccessToken(ctx.db, input.athleteId);

      const normalized = await fetchStreamsFromStrava(
        accessToken,
        input.stravaId,
      );

      if (normalized.length === 0) {
        throw new Error(
          `Streams for activity ${input.stravaId} not found on Strava`,
        );
      }

      const activity = await ctx.db.query.activities.findFirst({
        where: eq(activities.stravaId, input.stravaId),
      });

      if (!activity) {
        throw new Error(
          `Activity with stravaId ${input.stravaId} not found locally`,
        );
      }

      // Store new streams and re-compute scores
      await storeStreams(ctx.db, activity.id, normalized);

      const settingsDoc = await ctx.db.query.riderSettings.findFirst({
        where: eq(riderSettings.athlete, input.athleteId),
      });
      if (settingsDoc) {
        const updatedActivity = await ctx.db.query.activities.findFirst({
          where: eq(activities.id, activity.id),
        });
        if (updatedActivity) {
          await computeActivityScoresInternal(ctx.db, updatedActivity, settingsDoc);
        }
      }
    }),
});
