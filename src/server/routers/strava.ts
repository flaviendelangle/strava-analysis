import { router, publicProcedure } from '../trpc';

export const postRouter = router({
  hello: publicProcedure
    .query(async () => {
      return 'Hello world'
    }),
});
