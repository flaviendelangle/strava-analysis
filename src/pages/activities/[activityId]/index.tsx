import * as React from "react";

import { ActivityMap } from "~/components/ActivityMap";
import { ActivityStats } from "~/components/ActivityStats";
import { ReloadActivityFromStravaButton } from "~/components/ReloadActivityFromStravaButton";
import { ActivityStreams } from "~/components/charts/ActivityStreams";
import { PowerCurve } from "~/components/charts/PowerCurve";
import { useTypedParams } from "~/hooks/useTypedParams";
import { NextPageWithLayout } from "~/pages/_app";
import { formatActivityType } from "~/utils/format";
import { getSportConfig } from "~/utils/sportConfig";
import { trpc } from "~/utils/trpc";

const routerSchema = { activityId: "string" as const };

const ActivityPage: NextPageWithLayout = () => {
  const params = useTypedParams(routerSchema);
  const [hoverPosition, setHoverPosition] = React.useState<
    [number, number] | null
  >(null);

  const stravaId = params?.activityId ? Number(params.activityId) : undefined;

  const { data: activity } = trpc.activities.get.useQuery(
    { stravaId: stravaId! },
    { enabled: stravaId != null },
  );

  const { data: streamsData } = trpc.activityStreams.getStreams.useQuery(
    { stravaId: stravaId! },
    { enabled: stravaId != null },
  );

  const latlngRoute = React.useMemo(() => {
    if (!streamsData) return null;
    const stream = streamsData.find((s) => s.type === "latlng");
    if (!stream) return null;
    return JSON.parse(stream.data) as [number, number][];
  }, [streamsData]);

  return (
    <div className="flex h-full w-full flex-col">
      <nav className="border-border bg-background text-foreground flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">
            {activity?.name ?? "Loading..."}
          </span>
          {activity && (
            <React.Fragment>
              <span className="inline-flex items-center gap-1.5 rounded bg-gray-700 px-2 py-0.5 text-xs uppercase">
                {React.createElement(getSportConfig(activity.type).icon, { className: "size-3.5" })}
                {formatActivityType(activity.type)}
              </span>
              <span className="text-sm text-gray-400">
                {new Date(activity.startDateLocal).toLocaleDateString(
                  undefined,
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </span>
            </React.Fragment>
          )}
        </div>
        {activity && (
          <ReloadActivityFromStravaButton stravaId={activity.stravaId} />
        )}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        {activity && (
          <React.Fragment>
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="lg:flex-1">
                <ActivityStats activity={activity} />
              </div>

              {activity.mapPolyline && (
                <div className="h-96 w-full overflow-hidden rounded-lg lg:h-auto lg:min-h-96 lg:flex-1">
                  <ActivityMap
                    activity={activity}
                    highlightPosition={hoverPosition}
                    routePositions={latlngRoute}
                  />
                </div>
              )}
            </div>

            <ActivityStreams
              stravaId={activity.stravaId}
              onHoverPositionChange={setHoverPosition}
            />
            {activity.averageWatts != null &&
              (activity.type === "Ride" || activity.type === "VirtualRide") && (
                <PowerCurve stravaId={activity.stravaId} />
              )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
