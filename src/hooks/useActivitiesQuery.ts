import { useQuery } from "convex/react";
import { useCookies } from "react-cookie";

import { api } from "../../convex/_generated/api";
import { useAthleteId } from "./useAthleteId";

export function useActivitiesQuery() {
  const [state] = useCookies(["activity-type"]);
  const athleteId = useAthleteId();

  const result = useQuery(
    api.queries.listActivities,
    athleteId != null
      ? { athleteId, activityTypes: state["activity-type"] }
      : "skip",
  );

  return {
    data: result?.activities,
    allTypes: result?.allTypes,
    isLoading: result === undefined,
  };
}
