import { useCookies } from "react-cookie";

const COOKIE_NAMES = ["activity-type", "activity-date-from", "activity-date-to", "workout-type"] as const;

export function useActivityFilter() {
  const [state, setState] = useCookies([...COOKIE_NAMES]);

  const activityTypes: string[] = state["activity-type"] ?? [];
  const workoutTypes: number[] = state["workout-type"] ?? [];
  const dateFrom: string | undefined = state["activity-date-from"] || undefined;
  const dateTo: string | undefined = state["activity-date-to"] || undefined;

  const setActivityTypes = (types: string[]) => {
    setState("activity-type", types);
  };

  const setWorkoutTypes = (types: number[]) => {
    setState("workout-type", types);
  };

  const setDateFrom = (value: string | undefined) => {
    if (value) {
      setState("activity-date-from", value);
    } else {
      setState("activity-date-from", "", { maxAge: 0 });
    }
  };

  const setDateTo = (value: string | undefined) => {
    if (value) {
      setState("activity-date-to", value);
    } else {
      setState("activity-date-to", "", { maxAge: 0 });
    }
  };

  const clearAll = () => {
    setState("activity-type", []);
    setState("workout-type", []);
    setState("activity-date-from", "", { maxAge: 0 });
    setState("activity-date-to", "", { maxAge: 0 });
  };

  const activeFilterCount =
    activityTypes.length + workoutTypes.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  return {
    activityTypes,
    workoutTypes,
    dateFrom,
    dateTo,
    setActivityTypes,
    setWorkoutTypes,
    setDateFrom,
    setDateTo,
    clearAll,
    activeFilterCount,
  };
}
