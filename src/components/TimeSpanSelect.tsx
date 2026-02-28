import { Select, SelectProps } from "./primitives/Select";

export type TimeSpan = "last-year" | "last-2-years" | "all-time";

const TIME_SPANS: { value: TimeSpan; label: string }[] = [
  { value: "last-year", label: "Last Year" },
  { value: "last-2-years", label: "Last 2 Years" },
  { value: "all-time", label: "All Time" },
];

export function TimeSpanSelect(
  props: Omit<SelectProps<TimeSpan>, "options">,
) {
  return <Select {...props} options={TIME_SPANS} />;
}
