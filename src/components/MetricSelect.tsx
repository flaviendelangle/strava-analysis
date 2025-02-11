import { RouterOutput } from "~/utils/trpc";

import { Select, SelectProps } from "./primitives/Select";

export const METRICS: MetricConfig[] = [
  {
    value: "distance",
    label: "Distance (km)",
    getValue: (activity) => activity.distance / 1000,
  },
  {
    value: "elevation",
    label: "Elevation (m)",
    getValue: (activity) => activity.totalElevationGain,
  },
  {
    value: "movingTime",
    label: "Moving Time (hour)",
    getValue: (activity) => activity.movingTime / (60 * 60),
  },
  {
    value: "elapsedTime",
    label: "Elapsed Time (hour)",
    getValue: (activity) => activity.elapsedTime / (60 * 60),
  },
  {
    value: "activities",
    label: "Activities",
    getValue: () => 1,
  },
];

export function MetricSelect(props: Omit<SelectProps, "options">) {
  return <Select {...props} options={METRICS} />;
}

interface MetricConfig {
  value: string;
  label: string;
  getValue: (
    activity: RouterOutput["activities"]["listActivitiesWithoutMap"][number],
  ) => number;
}
