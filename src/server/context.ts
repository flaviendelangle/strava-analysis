import { Session, getServerSession } from "next-auth";

import type * as trpcNext from "@trpc/server/adapters/next";

import { authOptions } from "../pages/api/auth/[...nextauth]";

export interface Context {
  session: Session | null;
  req: trpcNext.NextApiRequest;
}

/**
 * Creates context for an incoming request
 * @see https://trpc.io/docs/v11/context
 */
export async function createContext(
  options: trpcNext.CreateNextContextOptions,
): Promise<Context> {
  const { req, res } = options;
  const session = await getServerSession(req, res, authOptions);

  return {
    session,
    req,
  };
}
