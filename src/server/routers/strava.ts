import { publicProcedure, router } from "../trpc";

export const stravaRouter = router({
  hello: publicProcedure.query(async () => {
    return "Hello world";
  }),
});
