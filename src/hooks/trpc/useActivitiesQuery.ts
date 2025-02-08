import { useCookies } from "react-cookie";

import { trpc } from "~/utils/trpc";

export function useActivitiesQuery() {
  const [state] = useCookies(["activity-type"]);
  const activitiesQuery = trpc.activities.listActivitiesWithoutMap.useQuery({
    activityTypes: state["activity-type"],
  });

  return activitiesQuery;
}
