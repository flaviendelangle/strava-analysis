import * as React from "react";

import { useQuery } from "convex/react";

import { ActivityMap } from "~/components/ActivityMap";
import { ReloadActivityFromStravaButton } from "~/components/ReloadActivityFromStravaButton";
import { ActivityStreams } from "~/components/charts/ActivityStreams";
import { useTypedParams } from "~/hooks/useTypedParams";
import { NextPageWithLayout } from "~/pages/_app";
import { formatDistance, formatSpeed } from "~/utils/format";

import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";

const routerSchema = { activityId: "string" as const };

function ActivityDetails(props: { activity: Doc<"activities"> }) {
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

  const stravaId = params?.activityId ? Number(params.activityId) : undefined;

  const activity = useQuery(
    api.queries.getActivity,
    stravaId != null ? { stravaId } : "skip",
  );

  return (
    <div className="flex h-full w-full flex-col">
      <nav className="flex justify-between border-b border-gray-600 bg-gray-800 p-4 text-white">
        <div>{activity?.name ?? "Loading..."}</div>
        {activity && (
          <ReloadActivityFromStravaButton stravaId={activity.stravaId} />
        )}
      </nav>
      <div className="flex h-full w-full flex-col 2xl:flex-row">
        <div className="h-96 2xl:h-full 2xl:w-1/2">
          {activity?.mapPolyline ? (
            <ActivityMap activity={activity} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">
              No map available
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 px-6 py-4 2xl:w-1/2">
          {activity && (
            <React.Fragment>
              <ActivityDetails activity={activity} />
              <ActivityStreams stravaId={activity.stravaId} />
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivitiesTablePage;
