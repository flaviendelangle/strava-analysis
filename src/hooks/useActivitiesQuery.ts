import { keepPreviousData } from "@tanstack/react-query";

import { trpc } from "~/utils/trpc";

import { useActivityFilter } from "./useActivityFilter";
import { useAthleteId } from "./useAthleteId";

export function useActivitiesQuery() {
  const { activityTypes, workoutTypes, dateFrom, dateTo } = useActivityFilter();
  const athleteId = useAthleteId();

  const result = trpc.activities.list.useQuery(
    { athleteId: athleteId!, activityTypes, workoutTypes, dateFrom, dateTo },
    { enabled: athleteId != null, placeholderData: keepPreviousData },
  );

  return {
    data: result.data?.activities,
    allTypes: result.data?.allTypes,
    allWorkoutTypes: result.data?.allWorkoutTypes,
    isLoading: result.isLoading,
  };
}
