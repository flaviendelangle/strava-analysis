import { initTRPC, TRPCError } from "@trpc/server";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import type { NextApiRequest, NextApiResponse } from "next";
import superjson from "superjson";

import { db, type Database } from "../db";
import { authOptions } from "../../src/pages/api/auth/[...nextauth]";

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
export const validateAthleteOwnership = t.middleware(
  async ({ ctx, input, next }) => {
    const { athleteId } = input as { athleteId: number };
    if (athleteId !== ctx.session?.athleteId) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  },
);
