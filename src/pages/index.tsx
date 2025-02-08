import { trpc } from '../utils/trpc';
import type { NextPageWithLayout } from './_app';

const IndexPage: NextPageWithLayout = () => {
  const postsQuery = trpc.post.hello.useQuery()

  return (
    <div className="flex flex-col bg-gray-800 py-8">
      {postsQuery.data ?? 'Loading...'}
    </div>
  );
};

export default IndexPage;
