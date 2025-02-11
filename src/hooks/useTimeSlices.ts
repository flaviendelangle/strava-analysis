import * as React from "react";

import { Dayjs } from "dayjs";

import { RouterOutput } from "~/utils/trpc";

import { useActivitiesTimeBoundaries } from "./useActivitiesTimeBoundaries";

export type SlicePrecision = "year" | "quarter" | "month" | "week";

export const useTimeSlices = ({
  precision,
  activities,
}: {
  precision: SlicePrecision;
  activities:
    | RouterOutput["activities"]["listActivitiesWithoutMap"]
    | undefined;
}) => {
  const boundaries = useActivitiesTimeBoundaries(activities);

  return React.useMemo(() => {
    if (boundaries.oldest == null || boundaries.newest == null) {
      return [];
    }

    return getSlicesInInterval({
      precision,
      start: boundaries.oldest,
      end: boundaries.newest,
    });
  }, [boundaries, precision]);
};

function getSlicesInInterval({
  precision,
  start,
  end,
}: {
  precision: SlicePrecision;
  start: Dayjs;
  end: Dayjs;
}) {
  const elements: Dayjs[] = [];

  const startDate = start.startOf(precision as any);
  const endDate = end.endOf(precision as any);

  let current = startDate;
  while (current.isBefore(endDate)) {
    elements.push(current);
    current = current.add(1, precision as any);
  }

  return elements.reverse();
}
