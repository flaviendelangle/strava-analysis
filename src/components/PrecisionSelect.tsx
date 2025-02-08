import { SlicePrecision } from "~/hooks/useTimeSlices";

import { Select, SelectProps } from "./primitives/Select";

export const PRECISIONS: PrecisionConfig[] = [
  {
    value: "year",
    label: "Year",
  },
  {
    value: "quarter",
    label: "Quarter",
  },
  {
    value: "month",
    label: "Month",
  },
  {
    value: "week",
    label: "Week",
  },
];

export function PrecisionSelect(
  props: Omit<SelectProps<SlicePrecision>, "options">,
) {
  return <Select {...props} options={PRECISIONS} />;
}

interface PrecisionConfig {
  value: SlicePrecision;
  label: string;
}
