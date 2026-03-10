import type { NextApiRequest, NextApiResponse } from "next";

import { createContext } from "@server/trpc";
import { appRouter } from "@server/trpc/root";
import { createNextApiHandler } from "@trpc/server/adapters/next";

const handler = createNextApiHandler({
  router: appRouter,
  createContext,
});

export default function trpcHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // CSRF protection: require content-type header for mutation requests.
  // Browsers won't send application/json cross-origin without a preflight,
  // so this prevents simple CSRF form submissions.
  if (req.method === "POST") {
    const contentType = req.headers["content-type"] ?? "";
    if (!contentType.includes("application/json")) {
      res.status(403).json({ error: "Invalid content type" });
      return;
    }
  }

  return handler(req, res);
}
