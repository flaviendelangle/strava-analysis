import nextDynamic from "next/dynamic";

import { ActivityTypeFilterPopover } from "~/components/settings/ActivityTypeFilterPopover";
import { Toolbar } from "~/components/settings/SettingsToolbar";
import { NextPageWithLayout } from "~/pages/_app";
import { POWER_BEST_ACTIVITY_TYPES } from "~/utils/constants";

const ActivitiesTimeline = nextDynamic(
  () =>
    import("~/components/charts/ActivitiesTimeline").then(
      (m) => m.ActivitiesTimeline,
    ),
  { ssr: false },
);
const ActivitiesCumulativeTimeline = nextDynamic(
  () =>
    import("~/components/charts/ActivitiesCumulativeTimeline").then(
      (m) => m.ActivitiesCumulativeTimeline,
    ),
  { ssr: false },
);
const PowerCurve = nextDynamic(
  () => import("~/components/charts/PowerCurve").then((m) => m.PowerCurve),
  { ssr: false },
);
const EddingtonChart = nextDynamic(
  () =>
    import("~/components/charts/EddingtonChart").then((m) => m.EddingtonChart),
  { ssr: false },
);

const StatisticsPage: NextPageWithLayout = () => {
  return (
    <>
      <Toolbar>
        <ActivityTypeFilterPopover />
      </Toolbar>
      <div className="flex flex-1 flex-col items-start gap-4 overflow-y-auto p-4">
        <ActivitiesTimeline />
        <ActivitiesCumulativeTimeline />
        <PowerCurve activityTypes={POWER_BEST_ACTIVITY_TYPES} />
        <EddingtonChart />
      </div>
    </>
  );
};

export const dynamic = "force-dynamic";

export default StatisticsPage;
