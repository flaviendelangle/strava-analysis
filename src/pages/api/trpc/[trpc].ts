import { createNextApiHandler } from "@trpc/server/adapters/next";

import { createContext } from "@server/trpc";
import { appRouter } from "@server/trpc/root";

export default createNextApiHandler({
  router: appRouter,
  createContext,
});
