import { useCookies } from "react-cookie";

import { trpc } from "~/utils/trpc";

import { useAthleteId } from "./useAthleteId";

export function useActivitiesWithMapQuery() {
  const [state] = useCookies(["activity-type"]);
  const athleteId = useAthleteId();

  const result = trpc.activities.list.useQuery(
    {
      athleteId: athleteId!,
      activityTypes: state["activity-type"],
      includeMap: true,
    },
    { enabled: athleteId != null },
  );

  return { data: result.data?.activities, isLoading: result.isLoading };
}
