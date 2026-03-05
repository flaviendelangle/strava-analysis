import { ActivitiesTable } from "~/components/ActivitiesTable";
import { SyncPanel } from "~/components/SyncPanel";
import { ActivityTypeFilterPopover } from "~/components/settings/ActivityTypeFilterPopover";
import { Toolbar } from "~/components/settings/SettingsToolbar";
import { NextPageWithLayout } from "~/pages/_app";

const ActivitiesPage: NextPageWithLayout = () => {
  return (
    <>
      <Toolbar>
        <ActivityTypeFilterPopover />
        <div className="bg-border mx-1 h-4 w-px" />
        <SyncPanel />
      </Toolbar>
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-0 md:p-4">
        <ActivitiesTable />
      </div>
    </>
  );
};

export default ActivitiesPage;
