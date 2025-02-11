import * as React from "react";

import { z } from "zod";

import { skipToken } from "@tanstack/react-query";

import { ActivityMap } from "~/components/ActivityMap";
import { ReloadActivityFromStravaButton } from "~/components/ReloadActivityFromStravaButton";
import { useTypedParams } from "~/hooks/useTypedParams";
import { NextPageWithLayout } from "~/pages/_app";
import { formatDistance, formatSpeed } from "~/utils/format";
import { RouterOutput, trpc } from "~/utils/trpc";

const routerSchema = z.object({ activityId: z.string() });

function ActivityDetails(props: {
  activity: Exclude<
    RouterOutput["activities"]["getActivityWithMap"],
    undefined
  >;
}) {
  const { activity } = props;

  return (
    <div className="w-96 rounded-md bg-gray-700 px-6 py-4">
      <div className="mb-4 text-2xl font-bold">Activity Details</div>
      <div className="flex justify-between">
        <span>Distance:</span>
        <span>{formatDistance(activity.distance)}</span>
      </div>
      <div className="flex justify-between">
        <span>Total elevation gain:</span>
        <span>{activity.totalElevationGain}m</span>
      </div>
      <div className="flex justify-between">
        <span>Average speed:</span>
        <span>{formatSpeed(activity.averageSpeed, activity.type)}</span>
      </div>
      <div className="flex justify-between">
        <span>Average watts:</span>
        <span>{activity.averageWatts}W</span>
      </div>
    </div>
  );
}

const ActivitiesTablePage: NextPageWithLayout = () => {
  const params = useTypedParams(routerSchema);

  const activityQuery = trpc.activities.getActivityWithMap.useQuery(
    params == null
      ? skipToken
      : {
          id: Number(params.activityId),
        },
  );

  return (
    <div className="flex h-full w-full flex-col">
      <nav className="border-b border-gray-600 bg-gray-800 p-4 text-white">
        {activityQuery.data?.name ?? "Loading..."}
      </nav>
      <div className="flex h-full w-full">
        <div className="h-full w-1/2">
          {activityQuery.data?.map_polyline ? (
            <ActivityMap activity={activityQuery.data} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">
              No map available
            </div>
          )}
        </div>
        <div className="flex h-full w-1/2 flex-col items-start gap-4 px-6 py-4">
          {activityQuery.data && (
            <React.Fragment>
              <ActivityDetails activity={activityQuery.data} />
              <ReloadActivityFromStravaButton id={activityQuery.data.id} />
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivitiesTablePage;
