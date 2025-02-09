import { trpc } from "../utils/trpc";
import { NextPageWithLayout } from "./_app";

const DashboardPage: NextPageWithLayout = () => {
  const postsQuery = trpc.strava.hello.useQuery();

  return (
    <div className="flex flex-col bg-gray-800 py-8">
      {postsQuery.data ?? "Loading..."}
    </div>
  );
};

export default DashboardPage;
