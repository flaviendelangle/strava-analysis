"use node";

import { v } from "convex/values";
import strava from "strava-v3";

import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { getAccessToken } from "./helpers";

const PAGE_SIZE = 50;

const STREAM_KEYS = [
  "distance",
  "watts",
  "altitude",
  "heartrate",
  "cadence",
  "temp",
  "velocity_smooth",
];

// ── Helpers ─────────────────────────────────────────────────────────────

function normalizeStreams(
  streams: unknown,
): {
  type: string;
  seriesType: string;
  originalSize: number;
  resolution: string;
  data: number[];
}[] {
  if (Array.isArray(streams)) {
    return streams.map((s: any) => ({
      type: s.type as string,
      seriesType: s.series_type as string,
      originalSize: s.original_size as number,
      resolution: s.resolution as string,
      data: s.data as number[],
    }));
  }

  if (streams && typeof streams === "object") {
    return Object.entries(streams).map(([type, s]: [string, any]) => ({
      type,
      seriesType: s.series_type as string,
      originalSize: s.original_size as number,
      resolution: s.resolution as string,
      data: s.data as number[],
    }));
  }

  return [];
}

function getModelFromStravaActivity(activity: any) {
  return {
    stravaId: activity.id as number,
    athlete: activity.athlete.id as number,
    type: activity.type as string,
    name: activity.name as string,
    startDate: activity.start_date as string,
    startDateLocal: activity.start_date_local as string,
    distance: activity.distance as number,
    totalElevationGain: activity.total_elevation_gain as number,
    averageSpeed: activity.average_speed as number,
    averageWatts: (activity.average_watts as number) ?? undefined,
    averageCadence: (activity.average_cadence as number) ?? undefined,
    averageHeartrate: (activity.average_heartrate as number) ?? undefined,
    maxHeartrate: (activity.max_heartrate as number) ?? undefined,
    maxSpeed: (activity.max_speed as number) ?? undefined,
    maxWatts: (activity.max_watts as number) ?? undefined,
    weightedAverageWatts:
      (activity.weighted_average_watts as number) ?? undefined,
    kilojoules: (activity.kilojoules as number) ?? undefined,
    calories: (activity.calories as number) ?? undefined,
    movingTime: activity.moving_time as number,
    elapsedTime: activity.elapsed_time as number,
    mapPolyline: (activity.map?.summary_polyline as string) ?? undefined,
  };
}

async function storeStreams(
  ctx: { runMutation: Function },
  stravaId: number,
  streams: ReturnType<typeof normalizeStreams>,
  scheduleScoreComputation: boolean,
) {
  await ctx.runMutation(internal.mutations.storeActivityStreamsBatch, {
    stravaId,
    streams: streams.map((s) => ({
      type: s.type,
      seriesType: s.seriesType,
      originalSize: s.originalSize,
      resolution: s.resolution,
      data: JSON.stringify(s.data),
    })),
    scheduleScoreComputation,
  });
}

async function fetchStreamsFromStrava(
  accessToken: string,
  stravaId: number,
): Promise<ReturnType<typeof normalizeStreams>> {
  const streams = await strava.streams.activity({
    access_token: accessToken,
    id: String(stravaId),
    keys: STREAM_KEYS.join(",") as unknown as string[],
    key_by_type: true,
  });

  return streams ? normalizeStreams(streams) : [];
}

// ── Sync actions ────────────────────────────────────────────────────────

export const syncActivitiesBatch = internalAction({
  args: {
    athleteId: v.number(),
    syncJobId: v.id("syncJobs"),
    afterTimestamp: v.optional(v.number()),
    page: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if sync is still active
    const syncJob = await ctx.runQuery(internal.queries.getSyncJobById, {
      syncJobId: args.syncJobId,
    });
    if (!syncJob || syncJob.status !== "fetching_activities") return;

    const accessToken = await getAccessToken(ctx, args.athleteId);

    // Fetch one page from Strava
    const stravaParams: Record<string, unknown> = {
      access_token: accessToken,
      per_page: PAGE_SIZE,
      page: args.page,
    };
    if (args.afterTimestamp) {
      stravaParams.after = args.afterTimestamp;
    }

    const pageActivities = await strava.athlete.listActivities(stravaParams);

    if (pageActivities.length > 0) {
      // Insert all activities in a single batch mutation
      const insertedCount: number = await ctx.runMutation(
        internal.mutations.insertActivitiesBatch,
        {
          activities: pageActivities.map(getModelFromStravaActivity),
        },
      );

      // Update progress
      await ctx.runMutation(internal.mutations.updateSyncJob, {
        syncJobId: args.syncJobId,
        patch: {
          activitiesFetched: syncJob.activitiesFetched + insertedCount,
        },
      });

      // If full page and we inserted at least some, continue
      if (pageActivities.length === PAGE_SIZE && insertedCount > 0) {
        await ctx.scheduler.runAfter(
          5_000,
          internal.actions.syncActivitiesBatch,
          {
            athleteId: args.athleteId,
            syncJobId: args.syncJobId,
            afterTimestamp: args.afterTimestamp,
            page: args.page + 1,
          },
        );
        return;
      }
    }

    // Activity fetching complete — transition to streams phase
    const activitiesWithoutStreams = await ctx.runQuery(
      internal.queries.getActivitiesWithoutStreams,
      { athleteId: args.athleteId, limit: 10000 },
    );
    const streamsTotal = activitiesWithoutStreams.length;

    await ctx.runMutation(internal.mutations.updateSyncJob, {
      syncJobId: args.syncJobId,
      patch: {
        activitiesPagesComplete: true,
        status: "fetching_streams" as const,
        streamsTotal,
      },
    });

    if (streamsTotal > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.actions.syncStreamsBatch,
        { athleteId: args.athleteId, syncJobId: args.syncJobId },
      );
    } else {
      // No streams to fetch — go to score computation
      await ctx.scheduler.runAfter(
        0,
        internal.mutations.computeScoresBatch,
        { athleteId: args.athleteId, syncJobId: args.syncJobId },
      );
    }
  },
});

export const syncStreamsBatch = internalAction({
  args: {
    athleteId: v.number(),
    syncJobId: v.id("syncJobs"),
  },
  handler: async (ctx, args) => {
    // Check if sync is still active
    const syncJob = await ctx.runQuery(internal.queries.getSyncJobById, {
      syncJobId: args.syncJobId,
    });
    if (!syncJob || syncJob.status !== "fetching_streams") return;

    const accessToken = await getAccessToken(ctx, args.athleteId);

    const activitiesWithoutStreams = await ctx.runQuery(
      internal.queries.getActivitiesWithoutStreams,
      { athleteId: args.athleteId, limit: 10 },
    );

    if (activitiesWithoutStreams.length === 0) {
      // All streams fetched — transition to score computation
      await ctx.runMutation(internal.mutations.updateSyncJob, {
        syncJobId: args.syncJobId,
        patch: { status: "computing_scores" as const },
      });
      await ctx.scheduler.runAfter(
        0,
        internal.mutations.computeScoresBatch,
        { athleteId: args.athleteId, syncJobId: args.syncJobId },
      );
      return;
    }

    let successCount = 0;

    for (const activity of activitiesWithoutStreams) {
      try {
        await new Promise((r) => setTimeout(r, 1_000));

        const normalized = await fetchStreamsFromStrava(
          accessToken,
          activity.stravaId,
        );

        // Store streams without scheduling individual score computation
        // (scores will be computed in bulk in phase 3)
        await storeStreams(ctx, activity.stravaId, normalized, false);
        successCount++;
      } catch (e) {
        console.error(
          `[syncStreamsBatch] Failed for activity ${activity.stravaId}:`,
          e,
        );
      }
    }

    // Update progress
    await ctx.runMutation(internal.mutations.updateSyncJob, {
      syncJobId: args.syncJobId,
      patch: {
        streamsFetched: syncJob.streamsFetched + successCount,
      },
    });

    // Schedule next batch with rate limiting delay
    await ctx.scheduler.runAfter(
      60_000,
      internal.actions.syncStreamsBatch,
      { athleteId: args.athleteId, syncJobId: args.syncJobId },
    );
  },
});

// ── Public actions ──────────────────────────────────────────────────────

export const reloadActivity = action({
  args: {
    stravaId: v.number(),
    athleteId: v.number(),
  },
  handler: async (ctx, args) => {
    const accessToken = await getAccessToken(ctx, args.athleteId);

    // Fetch fresh data from Strava before deleting anything, so that a
    // network failure doesn't leave the activity without stream data.
    const [activity, normalized] = await Promise.all([
      strava.activities.get({
        access_token: accessToken,
        id: String(args.stravaId),
      }),
      fetchStreamsFromStrava(accessToken, args.stravaId),
    ]);

    if (!activity) {
      throw new Error(`Activity ${args.stravaId} not found on Strava`);
    }

    // Delete existing streams now that we have fresh data
    await ctx.runMutation(internal.mutations.deleteActivityStreams, {
      stravaId: args.stravaId,
    });

    // Update activity metadata
    const model = getModelFromStravaActivity(activity);
    await ctx.runMutation(internal.mutations.updateActivity, {
      stravaId: args.stravaId,
      data: {
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
      },
    });

    // Store streams and schedule score recomputation
    await storeStreams(ctx, args.stravaId, normalized, true);
  },
});

export const fetchActivityStreams = action({
  args: {
    stravaId: v.number(),
    athleteId: v.number(),
  },
  handler: async (ctx, args) => {
    const accessToken = await getAccessToken(ctx, args.athleteId);

    // Fetch first, so that a network failure doesn't leave the activity
    // without stream data.
    const normalized = await fetchStreamsFromStrava(
      accessToken,
      args.stravaId,
    );

    if (normalized.length === 0) {
      throw new Error(
        `Streams for activity ${args.stravaId} not found on Strava`,
      );
    }

    // Delete existing streams now that we have fresh data
    await ctx.runMutation(internal.mutations.deleteActivityStreams, {
      stravaId: args.stravaId,
    });

    // Store streams and schedule score recomputation
    await storeStreams(ctx, args.stravaId, normalized, true);
  },
});
