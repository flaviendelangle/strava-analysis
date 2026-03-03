import * as React from "react";

import { ActivitiesCumulativeTimeline } from "~/components/charts/ActivitiesCumulativeTimeline";
import { ActivitiesTimeline } from "~/components/charts/ActivitiesTimeline";
import { EddingtonChart } from "~/components/charts/EddingtonChart";
import { PowerCurve } from "~/components/charts/PowerCurve";
import { NextPageWithLayout } from "~/pages/_app";
import { POWER_BEST_ACTIVITY_TYPES } from "~/utils/constants";

const StatisticsPage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <ActivitiesTimeline />
      <ActivitiesCumulativeTimeline />
      <PowerCurve activityTypes={POWER_BEST_ACTIVITY_TYPES} />
      <EddingtonChart
        title="Eddington Number - Riding"
        activityTypes={["Ride", "VirtualRide"]}
        distanceDivisor={1000}
        unitLabel="km"
      />
      <EddingtonChart
        title="Eddington Number - Running"
        activityTypes={["Run"]}
        distanceDivisor={100}
        unitLabel="x 100m"
      />
      <EddingtonChart
        title="Eddington Number - Swimming"
        activityTypes={["Swim"]}
        distanceDivisor={100}
        unitLabel="x 100m"
      />
    </div>
  );
};

export const dynamic = "force-dynamic";

export default StatisticsPage;
