import { useCookies } from "react-cookie";

import { trpc } from "~/utils/trpc";

import { useAthleteId } from "./useAthleteId";

export function useActivitiesQuery() {
  const [state] = useCookies(["activity-type"]);
  const athleteId = useAthleteId();

  const result = trpc.activities.list.useQuery(
    { athleteId: athleteId!, activityTypes: state["activity-type"] },
    { enabled: athleteId != null },
  );

  return {
    data: result.data?.activities,
    allTypes: result.data?.allTypes,
    isLoading: result.isLoading,
  };
}
