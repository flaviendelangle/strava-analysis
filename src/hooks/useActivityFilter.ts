import { useCookies } from "react-cookie";

const COOKIE_NAMES = ["activity-type", "workout-type", "time-period"] as const;

export function useActivityFilter() {
  const [state, setState] = useCookies([...COOKIE_NAMES]);

  const activityTypes: string[] = state["activity-type"] ?? [];
  const workoutTypes: number[] = state["workout-type"] ?? [];
  const timePeriodId: number | undefined = state["time-period"] || undefined;

  const setActivityTypes = (types: string[]) => {
    setState("activity-type", types);
  };

  const setWorkoutTypes = (types: number[]) => {
    setState("workout-type", types);
  };

  const setTimePeriodId = (value: number | undefined) => {
    if (value) {
      setState("time-period", value);
    } else {
      setState("time-period", "", { maxAge: 0 });
    }
  };

  const clearAll = () => {
    setState("activity-type", []);
    setState("workout-type", []);
    setState("time-period", "", { maxAge: 0 });
  };

  const activeFilterCount =
    activityTypes.length + workoutTypes.length + (timePeriodId ? 1 : 0);

  return {
    activityTypes,
    workoutTypes,
    timePeriodId,
    setActivityTypes,
    setWorkoutTypes,
    setTimePeriodId,
    clearAll,
    activeFilterCount,
  };
}
