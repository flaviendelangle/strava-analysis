import * as React from "react";

import { ActivitiesTable } from "~/components/ActivitiesTable";
import { SyncActivitiesButton } from "~/components/SyncActivitiesButton";
import { NextPageWithLayout } from "~/pages/_app";

const ActivitiesTablePage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <SyncActivitiesButton />
      <ActivitiesTable />
    </div>
  );
};

export default ActivitiesTablePage;
