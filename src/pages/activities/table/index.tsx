import * as React from "react";

import { ActivitiesTable } from "~/components/ActivitiesTable";
import { SyncActivitiesButtons } from "~/components/SyncActivitiesButtons";
import { NextPageWithLayout } from "~/pages/_app";

const ActivitiesTablePage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <SyncActivitiesButtons />
      <ActivitiesTable />
    </div>
  );
};

export default ActivitiesTablePage;
