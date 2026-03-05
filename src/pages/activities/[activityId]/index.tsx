import * as React from "react";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { ActivityActionsMenu } from "~/components/ActivityActionsMenu";
import { ActivityMap } from "~/components/ActivityMap";
import { ActivityStats } from "~/components/ActivityStats";
import { ActivityStreams } from "~/components/charts/ActivityStreams";
import { PowerCurve } from "~/components/charts/PowerCurve";
import { Toolbar } from "~/components/settings/SettingsToolbar";
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
        <p className="text-muted-foreground">Activity not found</p>
      </div>
    );
  }

  return (
    <>
      <Toolbar actions={<ActivityActionsMenu stravaId={activity.stravaId} />}>
        <Link
          href="/activities"
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <span className="min-w-0 truncate font-semibold">{activity.name}</span>
        <span className="bg-accent text-accent-foreground inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium uppercase">
          {React.createElement(getSportConfig(activity.type).icon, {
            className: "size-3.5",
          })}
          {formatActivityType(activity.type)}
        </span>
        <span className="text-muted-foreground hidden shrink-0 text-sm sm:inline">
          {new Date(activity.startDateLocal).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </Toolbar>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:gap-6 sm:p-6">
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row">
          <div className="lg:flex-1">
            <ActivityStats activity={activity} />
          </div>

          {activity.mapPolyline && (
            <div className="border-border h-96 w-full overflow-hidden rounded-xl border lg:h-auto lg:min-h-96 lg:flex-1">
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
    </>
  );
}

function ActivityPageSkeleton() {
  return (
    <>
      <Toolbar>
        <div className="bg-accent size-8 animate-pulse rounded-lg" />
        <div className="bg-accent h-6 w-48 animate-pulse rounded" />
        <div className="bg-accent h-5 w-20 animate-pulse rounded-md" />
        <div className="bg-accent h-5 w-40 animate-pulse rounded" />
      </Toolbar>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:gap-6 sm:p-6">
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row">
          <div className="lg:flex-1">
            <div className="border-border bg-card rounded-xl border p-5">
              <div className="bg-accent mb-4 h-7 w-36 animate-pulse rounded" />
              {/* Hero row skeleton */}
              <div className="border-border mb-4 grid grid-cols-3 gap-2.5 border-b pb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <div className="bg-accent mb-1 h-3 w-16 animate-pulse rounded" />
                    <div className="bg-accent mt-1 h-8 w-24 animate-pulse rounded" />
                  </div>
                ))}
              </div>
              {/* Section skeletons */}
              <div className="flex flex-col gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i}>
                    <div className="bg-accent mb-2 h-3 w-24 animate-pulse rounded" />
                    <div className="grid grid-cols-2 gap-x-2 md:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j}>
                          <div className="bg-accent mb-1 h-3 w-14 animate-pulse rounded" />
                          <div className="bg-accent h-7 w-20 animate-pulse rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="border-border bg-secondary h-96 w-full animate-pulse rounded-xl border lg:h-auto lg:min-h-96 lg:flex-1" />
        </div>
        <div className="bg-card h-64 animate-pulse rounded-xl" />
        <div className="bg-secondary h-96 animate-pulse rounded-xl" />
      </div>
    </>
  );
}

export default ActivityPage;
