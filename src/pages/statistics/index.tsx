import { ActivitiesCumulativeTimeline } from "~/components/charts/ActivitiesCumulativeTimeline";
import { ActivitiesTimeline } from "~/components/charts/ActivitiesTimeline";
import { EddingtonChart } from "~/components/charts/EddingtonChart";
import { PowerCurve } from "~/components/charts/PowerCurve";
import { ActivityTypeFilterPopover } from "~/components/settings/ActivityTypeFilterPopover";
import { Toolbar } from "~/components/settings/SettingsToolbar";
import { NextPageWithLayout } from "~/pages/_app";
import { POWER_BEST_ACTIVITY_TYPES } from "~/utils/constants";

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
