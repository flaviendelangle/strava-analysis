import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { activities, syncJobs } from "../../db/schema";
import { runSyncInBackground } from "../../lib/sync";
import {
  protectedProcedure,
  router,
  validateAthleteOwnership,
} from "../index";

export const syncRouter = router({
  getJob: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .use(validateAthleteOwnership)
    .query(async ({ ctx, input }) => {
      return (
        (await ctx.db.query.syncJobs.findFirst({
          where: eq(syncJobs.athlete, input.athleteId),
        })) ?? null
      );
    }),

  start: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .use(validateAthleteOwnership)
    .mutation(async ({ ctx, input }) => {
      // Check for existing in-progress sync job
      const existing = await ctx.db.query.syncJobs.findFirst({
        where: eq(syncJobs.athlete, input.athleteId),
      });

      if (
        existing &&
        (existing.status === "fetching_activities" ||
          existing.status === "fetching_streams" ||
          existing.status === "computing_scores")
      ) {
        return existing.id;
      }

      // Get latest activity for the `after` Strava parameter
      const latestActivity = await ctx.db
        .select()
        .from(activities)
        .where(eq(activities.athlete, input.athleteId))
        .orderBy(desc(activities.startDate))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      const now = Date.now();
      let syncJobId: number;

      if (existing) {
        // Reuse existing document (completed/failed)
        await ctx.db
          .update(syncJobs)
          .set({
            status: "fetching_activities",
            activitiesFetched: 0,
            activitiesPagesComplete: false,
            streamsTotal: 0,
            streamsFetched: 0,
            lastError: null,
            startedAt: now,
          })
          .where(eq(syncJobs.id, existing.id));
        syncJobId = existing.id;
      } else {
        const [row] = await ctx.db
          .insert(syncJobs)
          .values({
            athlete: input.athleteId,
            status: "fetching_activities",
            activitiesFetched: 0,
            activitiesPagesComplete: false,
            streamsTotal: 0,
            streamsFetched: 0,
            startedAt: now,
          })
          .returning({ id: syncJobs.id });
        syncJobId = row.id;
      }

      // Fire-and-forget background sync
      runSyncInBackground(ctx.db, input.athleteId, syncJobId).catch((err) =>
        console.error("[runSyncInBackground] Unhandled error:", err),
      );

      return syncJobId;
    }),

  forceResync: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .use(validateAthleteOwnership)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.syncJobs.findFirst({
        where: eq(syncJobs.athlete, input.athleteId),
      });

      if (
        existing &&
        (existing.status === "fetching_activities" ||
          existing.status === "fetching_streams" ||
          existing.status === "computing_scores")
      ) {
        return existing.id;
      }

      // Reset all activities so streams (including latlng) get re-fetched
      await ctx.db
        .update(activities)
        .set({ areStreamsLoaded: false })
        .where(eq(activities.athlete, input.athleteId));

      const now = Date.now();
      let syncJobId: number;

      if (existing) {
        await ctx.db
          .update(syncJobs)
          .set({
            status: "fetching_activities",
            activitiesFetched: 0,
            activitiesPagesComplete: false,
            streamsTotal: 0,
            streamsFetched: 0,
            lastError: null,
            startedAt: now,
          })
          .where(eq(syncJobs.id, existing.id));
        syncJobId = existing.id;
      } else {
        const [row] = await ctx.db
          .insert(syncJobs)
          .values({
            athlete: input.athleteId,
            status: "fetching_activities",
            activitiesFetched: 0,
            activitiesPagesComplete: false,
            streamsTotal: 0,
            streamsFetched: 0,
            startedAt: now,
          })
          .returning({ id: syncJobs.id });
        syncJobId = row.id;
      }

      runSyncInBackground(ctx.db, input.athleteId, syncJobId).catch((err) =>
        console.error("[runSyncInBackground] Unhandled error:", err),
      );

      return syncJobId;
    }),
});
