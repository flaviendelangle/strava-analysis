import { useQuery } from "convex/react";
import { useCookies } from "react-cookie";

import { api } from "../../convex/_generated/api";
import { useAthleteId } from "./useAthleteId";

export function useActivitiesWithMapQuery() {
  const [state] = useCookies(["activity-type"]);
  const athleteId = useAthleteId();

  const data = useQuery(
    api.queries.listActivitiesWithMap,
    athleteId != null
      ? { athleteId, activityTypes: state["activity-type"] }
      : "skip",
  );

  return { data, isLoading: data === undefined };
}
