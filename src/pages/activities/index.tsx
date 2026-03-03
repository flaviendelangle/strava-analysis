import { ActivitiesTable } from "~/components/ActivitiesTable";
import { NextPageWithLayout } from "~/pages/_app";

const ActivitiesPage: NextPageWithLayout = () => {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ActivitiesTable />
    </div>
  );
};

export default ActivitiesPage;
