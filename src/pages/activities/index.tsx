import { ActivitiesTable } from "~/components/ActivitiesTable";
import { NextPageWithLayout } from "~/pages/_app";

const ActivitiesPage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <ActivitiesTable />
    </div>
  );
};

export default ActivitiesPage;
