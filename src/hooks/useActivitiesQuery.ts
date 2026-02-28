import { useQuery } from "convex/react";
import { useCookies } from "react-cookie";

import { api } from "../../convex/_generated/api";
import { useAthleteId } from "./useAthleteId";

export function useActivitiesQuery() {
  const [state] = useCookies(["activity-type"]);
  const athleteId = useAthleteId();

  const data = useQuery(
    api.queries.listActivities,
    athleteId != null
      ? { athleteId, activityTypes: state["activity-type"] }
      : "skip",
  );

  return { data, isLoading: data === undefined };
}
