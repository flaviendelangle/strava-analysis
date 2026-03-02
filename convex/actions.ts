"use node";

import { v } from "convex/values";
import strava from "strava-v3";

import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";

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

async function getAccessToken(
  ctx: { runQuery: Function },
  athleteId: number,
): Promise<string> {
  const athlete = await ctx.runQuery(internal.queries.getAthleteByStravaId, {
    stravaAthleteId: athleteId,
  });

  if (!athlete) {
    throw new Error(`Athlete ${athleteId} not found`);
  }

  return athlete.accessToken;
}

async function storeStreams(
  ctx: { runMutation: Function },
  stravaId: number,
  streams: ReturnType<typeof normalizeStreams>,
) {
  for (const stream of streams) {
    await ctx.runMutation(internal.mutations.storeActivityStream, {
      stravaId,
      type: stream.type,
      seriesType: stream.seriesType,
      originalSize: stream.originalSize,
      resolution: stream.resolution,
      data: stream.data,
    });
  }
  await ctx.runMutation(internal.mutations.markStreamsLoaded, { stravaId });
}

function normalizeStreams(
  streams: unknown,
): { type: string; seriesType: string; originalSize: number; resolution: string; data: number[] }[] {
  // When key_by_type is true, Strava returns an object keyed by stream type
  // When false or unset, it returns an array of stream objects
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

export const checkForNewActivities = action({
  args: { athleteId: v.number() },
  handler: async (ctx, args) => {
    const accessToken = await getAccessToken(ctx, args.athleteId);

    const latestActivity = await ctx.runQuery(
      internal.queries.getLatestActivity,
      { athleteId: args.athleteId },
    );

    let activities: any[] = [];
    if (latestActivity) {
      let page = 1;
      while (page < 10) {
        const pageActivities = await strava.athlete.listActivities({
          access_token: accessToken,
          per_page: PAGE_SIZE,
          after: new Date(latestActivity.startDate).getTime() / 1000,
        });
        activities.push(...pageActivities);
        page += 1;
        if (pageActivities.length < PAGE_SIZE) break;
      }
    } else {
      activities = await strava.athlete.listActivities({
        access_token: accessToken,
        per_page: PAGE_SIZE,
      });
    }

    await Promise.all(
      activities.map((activity) =>
        ctx.runMutation(
          internal.mutations.insertActivity,
          getModelFromStravaActivity(activity),
        ),
      ),
    );

    // Fetch streams for activities that don't have them yet
    await ctx.scheduler.runAfter(
      5_000,
      internal.actions.fetchMissingStreams,
      { athleteId: args.athleteId },
    );
  },
});

export const loadOlderActivities = action({
  args: { athleteId: v.number() },
  handler: async (ctx, args) => {
    const accessToken = await getAccessToken(ctx, args.athleteId);

    const oldestActivity = await ctx.runQuery(
      internal.queries.getOldestActivity,
      { athleteId: args.athleteId },
    );

    const activities: any[] = await strava.athlete.listActivities({
      access_token: accessToken,
      per_page: PAGE_SIZE,
      ...(oldestActivity && {
        before: new Date(oldestActivity.startDate).getTime() / 1000,
      }),
    });

    await Promise.all(
      activities.map((activity) =>
        ctx.runMutation(
          internal.mutations.insertActivity,
          getModelFromStravaActivity(activity),
        ),
      ),
    );

    // Fetch streams for activities that don't have them yet
    await ctx.scheduler.runAfter(
      5_000,
      internal.actions.fetchMissingStreams,
      { athleteId: args.athleteId },
    );
  },
});

export const reloadActivity = action({
  args: {
    stravaId: v.number(),
    athleteId: v.number(),
  },
  handler: async (ctx, args) => {
    const accessToken = await getAccessToken(ctx, args.athleteId);

    // Delete existing streams
    await ctx.runMutation(internal.mutations.deleteActivityStreams, {
      stravaId: args.stravaId,
    });

    // Fetch fresh data from Strava
    const [activity, streams] = await Promise.all([
      strava.activities.get({
        access_token: accessToken,
        id: String(args.stravaId),
      }),
      strava.streams.activity({
        access_token: accessToken,
        id: String(args.stravaId),
        keys: STREAM_KEYS.join(",") as unknown as string[],
        key_by_type: true,
      }),
    ]);

    if (!activity) {
      throw new Error(`Activity ${args.stravaId} not found on Strava`);
    }

    // Update activity data
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

    // Store new streams
    if (streams) {
      await storeStreams(ctx, args.stravaId, normalizeStreams(streams));
    }
  },
});

export const fetchActivityStreams = action({
  args: {
    stravaId: v.number(),
    athleteId: v.number(),
  },
  handler: async (ctx, args) => {
    const accessToken = await getAccessToken(ctx, args.athleteId);

    // Delete existing (possibly bad) streams before re-fetching
    await ctx.runMutation(internal.mutations.deleteActivityStreams, {
      stravaId: args.stravaId,
    });

    const streams = await strava.streams.activity({
      access_token: accessToken,
      id: String(args.stravaId),
      keys: STREAM_KEYS.join(",") as unknown as string[],
      key_by_type: true,
    });

    console.log("[fetchActivityStreams] raw response type:", typeof streams);
    console.log(
      "[fetchActivityStreams] isArray:",
      Array.isArray(streams),
      "keys:",
      streams && typeof streams === "object"
        ? Object.keys(streams)
        : "not an object",
    );

    if (!streams) {
      throw new Error(
        `Streams for activity ${args.stravaId} not found on Strava`,
      );
    }

    const normalized = normalizeStreams(streams);
    console.log(
      "[fetchActivityStreams] normalized:",
      normalized.length,
      "streams, types:",
      normalized.map((s) => s.type),
    );

    await storeStreams(ctx, args.stravaId, normalized);
  },
});

export const fetchMissingStreams = internalAction({
  args: { athleteId: v.number() },
  handler: async (ctx, args) => {
    const accessToken = await getAccessToken(ctx, args.athleteId);

    const activitiesWithoutStreams = await ctx.runQuery(
      internal.queries.getActivitiesWithoutStreams,
      { athleteId: args.athleteId, limit: 5 },
    );

    if (activitiesWithoutStreams.length === 0) {
      return;
    }

    for (const activity of activitiesWithoutStreams) {
      try {
        const streams = await strava.streams.activity({
          access_token: accessToken,
          id: String(activity.stravaId),
          keys: STREAM_KEYS.join(",") as unknown as string[],
          key_by_type: true,
        });

        if (streams) {
          // Delete any partially-stored chunks from a previous concurrent
          // fetch to avoid duplicates that inflate HRSS.
          await ctx.runMutation(internal.mutations.deleteActivityStreams, {
            stravaId: activity.stravaId,
          });
          await storeStreams(
            ctx,
            activity.stravaId,
            normalizeStreams(streams),
          );
        }
      } catch (e) {
        console.error(
          `[fetchMissingStreams] Failed for activity ${activity.stravaId}:`,
          e,
        );
      }
    }

    // Check if more activities need streams and schedule next batch
    const remaining = await ctx.runQuery(
      internal.queries.getActivitiesWithoutStreams,
      { athleteId: args.athleteId, limit: 1 },
    );

    if (remaining.length > 0) {
      await ctx.scheduler.runAfter(
        30_000,
        internal.actions.fetchMissingStreams,
        { athleteId: args.athleteId },
      );
    }
  },
});

export const backfillScores = action({
  args: { athleteId: v.number() },
  handler: async (ctx, args) => {
    // Recompute scores for activities that already have streams
    await ctx.runMutation(internal.mutations.recomputeAllScores, {
      athleteId: args.athleteId,
    });

    // Start fetching streams for activities that don't have them
    await ctx.scheduler.runAfter(
      0,
      internal.actions.fetchMissingStreams,
      { athleteId: args.athleteId },
    );
  },
});
