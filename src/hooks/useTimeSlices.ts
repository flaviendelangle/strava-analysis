import * as React from "react";

import { isBefore } from "date-fns";

import { addUnit, endOf, startOf } from "~/utils/dateUtils";

import { Doc } from "../../convex/_generated/dataModel";
import { useActivitiesTimeBoundaries } from "./useActivitiesTimeBoundaries";

export type SlicePrecision = "year" | "quarter" | "month" | "week";

export const useTimeSlices = ({
  precision,
  activities,
}: {
  precision: SlicePrecision;
  activities: Omit<Doc<"activities">, "mapPolyline">[] | undefined;
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
  start: Date;
  end: Date;
}) {
  const elements: Date[] = [];

  const startDate = startOf(start, precision);
  const endDate = endOf(end, precision);

  let current = startDate;
  while (isBefore(current, endDate)) {
    elements.push(current);
    current = addUnit(current, 1, precision);
  }

  return elements;
}
