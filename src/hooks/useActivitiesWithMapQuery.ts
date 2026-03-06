import { keepPreviousData } from "@tanstack/react-query";

import { trpc } from "~/utils/trpc";

import { useActivityFilter } from "./useActivityFilter";
import { useAthleteId } from "./useAthleteId";

export function useActivitiesWithMapQuery() {
  const { activityTypes, workoutTypes, dateFrom, dateTo } = useActivityFilter();
  const athleteId = useAthleteId();

  const result = trpc.activities.list.useQuery(
    {
      athleteId: athleteId!,
      activityTypes,
      workoutTypes,
      dateFrom,
      dateTo,
      includeMap: true,
    },
    { enabled: athleteId != null, placeholderData: keepPreviousData },
  );

  return { data: result.data?.activities, isLoading: result.isLoading };
}
