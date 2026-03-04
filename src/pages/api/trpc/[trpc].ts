import { createContext } from "@server/trpc";
import { appRouter } from "@server/trpc/root";
import { createNextApiHandler } from "@trpc/server/adapters/next";

export default createNextApiHandler({
  router: appRouter,
  createContext,
});
