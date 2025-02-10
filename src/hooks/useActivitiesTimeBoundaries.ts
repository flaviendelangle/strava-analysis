import * as React from "react";

import dayjs, { Dayjs } from "dayjs";

import { RouterOutput } from "~/utils/trpc";

export const useActivitiesTimeBoundaries = (
  activities?: RouterOutput["strava"]["activities"],
) =>
  React.useMemo(() => {
    let oldestActivityDate: Dayjs | null = null;
    let newestActivityDate: Dayjs | null = null;

    for (const activity of activities ?? []) {
      const activityDate = dayjs(activity.startDate);
      if (
        oldestActivityDate == null ||
        activityDate.isBefore(oldestActivityDate)
      ) {
        oldestActivityDate = activityDate;
      }
      if (
        newestActivityDate == null ||
        activityDate.isAfter(newestActivityDate)
      ) {
        newestActivityDate = activityDate;
      }
    }

    return {
      oldest: oldestActivityDate,
      newest: newestActivityDate,
    };
  }, [activities]);
