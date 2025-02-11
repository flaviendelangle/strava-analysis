import { useCookies } from "react-cookie";

import { trpc } from "~/utils/trpc";

export function useActivitiesWithMapQuery() {
  const [state] = useCookies(["activity-type"]);
  const activitiesWithMapQuery = trpc.strava.activitiesWithMap.useQuery({
    activityTypes: state["activity-type"],
  });

  return activitiesWithMapQuery;
}
