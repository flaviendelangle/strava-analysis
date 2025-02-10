import * as React from "react";

import ActivitiesTimeline from "~/components/ActivitiesTimeline/ActivitiesTimeline";
import { NextPageWithLayout } from "~/pages/_app";

const StatisticsPage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <ActivitiesTimeline />
    </div>
  );
};

export const dynamic = "force-dynamic";

export default StatisticsPage;
