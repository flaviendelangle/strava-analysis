import * as React from "react";

import { isAfter } from "date-fns";

import { isSameUnit } from "~/utils/dateUtils";

import type { Activity } from "@server/db/types";
import { SlicePrecision } from "./useTimeSlices";

type ActivityWithoutMap = Omit<Activity, "mapPolyline">;

export const useGroupActivitiesByTimeSlice = ({
  slices,
  precision,
  activities,
}: {
  slices: Date[];
  precision: SlicePrecision;
  activities: ActivityWithoutMap[] | undefined;
}) =>
  React.useMemo(() => {
    const temp = slices.reduce(
      (acc, date) => {
        acc[date.toISOString()] = {
          date,
          activities: [],
        };

        return acc;
      },
      {} as Record<
        string,
        {
          date: Date;
          activities: ActivityWithoutMap[];
        }
      >,
    );

    for (const activity of activities ?? []) {
      const month = slices.find((date) =>
        isSameUnit(date, new Date(activity.startDate), precision),
      );
      if (month) {
        temp[month.toISOString()].activities.push(activity);
      }
    }

    return Object.values(temp).sort((a, b) =>
      isAfter(a.date, b.date) ? 1 : -1,
    );
  }, [slices, activities, precision]);

export type GroupedActivities = ReturnType<
  typeof useGroupActivitiesByTimeSlice
>;
