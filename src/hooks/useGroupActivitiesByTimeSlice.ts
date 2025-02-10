import * as React from "react";

import dayjs, { Dayjs } from "dayjs";

import { RouterOutput } from "~/utils/trpc";

import { SlicePrecision } from "./useTimeSlices";

export const useGroupActivitiesByTimeSlice = ({
  slices,
  precision,
  activities,
}: {
  slices: Dayjs[];
  precision: SlicePrecision;
  activities: RouterOutput["strava"]["activities"] | undefined;
}) =>
  React.useMemo(() => {
    const temp = slices.reduce(
      (acc, date) => {
        acc[date.toISOString()] = {
          date: dayjs(date),
          activities: [],
        };

        return acc;
      },
      {} as Record<
        string,
        { date: Dayjs; activities: RouterOutput["strava"]["activities"] }
      >,
    );

    for (const activity of activities ?? []) {
      const month = slices.find((date) =>
        date.isSame(dayjs(activity.startDate), precision as any),
      );
      if (month) {
        temp[month.toISOString()].activities.push(activity);
      }
    }

    return Object.values(temp).sort((a, b) =>
      a.date.isAfter(b.date) ? 1 : -1,
    );
  }, [slices, activities, precision]);
