import type { Activity } from "@server/db/types";

import { Select, SelectProps } from "./primitives/Select";

export const METRICS: MetricConfig[] = [
  {
    value: "distance",
    label: "Distance (km)",
    unit: "km",
    getValue: (activity) => activity.distance / 1000,
  },
  {
    value: "elevation",
    label: "Elevation (m)",
    unit: "m",
    getValue: (activity) => activity.totalElevationGain,
  },
  {
    value: "movingTime",
    label: "Moving Time (hour)",
    unit: "h",
    getValue: (activity) => activity.movingTime / (60 * 60),
  },
  {
    value: "elapsedTime",
    label: "Elapsed Time (hour)",
    unit: "h",
    getValue: (activity) => activity.elapsedTime / (60 * 60),
  },
  {
    value: "hrss",
    label: "HRSS",
    unit: "",
    getValue: (activity) => activity.hrss ?? 0,
  },
  {
    value: "activities",
    label: "Activities",
    unit: "",
    getValue: () => 1,
  },
];

export function MetricSelect(props: Omit<SelectProps, "options">) {
  return <Select {...props} options={METRICS} />;
}

export interface MetricConfig {
  value: string;
  label: string;
  unit: string;
  getValue: (activity: Omit<Activity, "mapPolyline">) => number;
}
