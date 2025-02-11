import { useCookies } from "react-cookie";

import { trpc } from "~/utils/trpc";

export function useActivitiesQuery() {
  const [state] = useCookies(["activity-type"]);
  const activitiesQuery = trpc.strava.activities.useQuery({
    activityTypes: state["activity-type"],
  });

  return activitiesQuery;
}
