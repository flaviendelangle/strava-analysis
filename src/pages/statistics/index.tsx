import * as React from "react";

import { ActivitiesCumulativeTimeline } from "~/components/charts/ActivitiesCumulativeTimeline";
import { ActivitiesTimeline } from "~/components/charts/ActivitiesTimeline";
import { NextPageWithLayout } from "~/pages/_app";

const StatisticsPage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <ActivitiesTimeline />
      <ActivitiesCumulativeTimeline />
    </div>
  );
};

export const dynamic = "force-dynamic";

export default StatisticsPage;
