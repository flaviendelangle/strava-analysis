/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */
import { router, publicProcedure } from '../trpc';

export const postRouter = router({
  hello: publicProcedure
    .query(async () => {
      return 'Hello world'
    }),
});
