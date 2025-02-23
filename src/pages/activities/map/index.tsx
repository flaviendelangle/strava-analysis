import * as React from "react";

import { ActivitiesMap } from "~/components/ActivitiesMap";
import { NextPageWithLayout } from "~/pages/_app";

const ActivitiesTablePage: NextPageWithLayout = () => {
  return <ActivitiesMap />;
};

export const dynamic = "force-dynamic";

export default ActivitiesTablePage;
