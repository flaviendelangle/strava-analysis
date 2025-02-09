/**
 * This file contains the root router of your tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from "../trpc";
import { stravaRouter } from "./strava";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => "yay!"),

  strava: stravaRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
