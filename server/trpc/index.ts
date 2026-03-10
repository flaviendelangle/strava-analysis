import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import superjson from "superjson";

import { TRPCError, initTRPC } from "@trpc/server";

import { authOptions } from "../../src/pages/api/auth/[...nextauth]";
import { type Database, db } from "../db";

export async function createContext(opts: {
  req: NextApiRequest;
  res: NextApiResponse;
}) {
  const session = await getServerSession(opts.req, opts.res, authOptions);
  return { db, session };
}

export type Context = {
  db: Database;
  session: Session | null;
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

/**
 * Middleware that validates `input.athleteId` matches the session's athleteId.
 * Chain after `.input()` on routes that accept athleteId.
 */
/**
 * Simple in-memory rate limiter.
 * Tracks requests per key within a sliding window.
 */
const rateLimitStore = new Map<string, number[]>();

function rateLimit(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(key) ?? []).filter(
    (ts) => now - ts < windowMs,
  );
  if (timestamps.length >= maxRequests) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded. Please try again later.",
    });
  }
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
}

/**
 * Rate-limiting middleware for expensive mutations.
 * Limits to 5 requests per minute per user.
 */
export const rateLimited = t.middleware(async ({ ctx, next }) => {
  const userId = String(ctx.session?.athleteId ?? "anonymous");
  rateLimit(userId, 5, 60_000);
  return next();
});

export const validateAthleteOwnership = t.middleware(
  async ({ ctx, input, next }) => {
    const { athleteId } = input as { athleteId: number };
    if (athleteId !== ctx.session?.athleteId) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  },
);
