import * as React from "react";

import { ActivityMap } from "~/components/ActivityMap";
import { ActivityStats } from "~/components/ActivityStats";
import { ActivityActionsMenu } from "~/components/ActivityActionsMenu";
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
  const stravaId = params?.activityId ? Number(params.activityId) : undefined;

  if (stravaId == null) {
    return null;
  }

  return (
    <React.Suspense fallback={<ActivityPageSkeleton />}>
      <ActivityPageContent stravaId={stravaId} />
    </React.Suspense>
  );
};

function ActivityPageContent({ stravaId }: { stravaId: number }) {
  const [hoverPosition, setHoverPosition] = React.useState<
    [number, number] | null
  >(null);

  const [activity] = trpc.activities.get.useSuspenseQuery({ stravaId });
  const [streamsData] = trpc.activityStreams.getStreams.useSuspenseQuery({
    stravaId,
  });

  const latlngRoute = React.useMemo(() => {
    if (!streamsData) return null;
    const stream = streamsData.find((s) => s.type === "latlng");
    if (!stream) return null;
    return JSON.parse(stream.data) as [number, number][];
  }, [streamsData]);

  if (!activity) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-gray-400">Activity not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <nav className="border-border bg-background text-foreground flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">{activity.name}</span>
          <span className="inline-flex items-center gap-1.5 rounded bg-gray-700 px-2 py-0.5 text-xs uppercase">
            {React.createElement(getSportConfig(activity.type).icon, {
              className: "size-3.5",
            })}
            {formatActivityType(activity.type)}
          </span>
          <span className="text-sm text-gray-400">
            {new Date(activity.startDateLocal).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <ActivityActionsMenu stravaId={activity.stravaId} />
      </nav>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
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
      </div>
    </div>
  );
}

function ActivityPageSkeleton() {
  return (
    <div className="flex h-full w-full flex-col">
      <nav className="border-border bg-background text-foreground flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-48 animate-pulse rounded bg-gray-700" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-700" />
          <div className="h-5 w-40 animate-pulse rounded bg-gray-700" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded bg-gray-700" />
      </nav>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:flex-1">
            <div className="rounded-lg bg-card p-4">
              <div className="mb-3 h-7 w-36 animate-pulse rounded bg-gray-700" />
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-md bg-gray-800 px-3 py-2">
                    <div className="mb-1 h-3 w-16 animate-pulse rounded bg-gray-700" />
                    <div className="h-7 w-20 animate-pulse rounded bg-gray-700" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="h-96 w-full animate-pulse rounded-lg bg-gray-800 lg:h-auto lg:min-h-96 lg:flex-1" />
        </div>
        <div className="h-64 animate-pulse rounded-md bg-card" />
        <div className="h-96 animate-pulse rounded-md bg-secondary" />
      </div>
    </div>
  );
}

export default ActivityPage;
