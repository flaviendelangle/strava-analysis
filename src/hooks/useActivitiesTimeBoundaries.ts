import * as React from "react";

import { isBefore, isAfter } from "date-fns";

import { Doc } from "../../convex/_generated/dataModel";

export const useActivitiesTimeBoundaries = (
  activities?: Omit<Doc<"activities">, "mapPolyline">[],
) =>
  React.useMemo(() => {
    let oldestActivityDate: Date | null = null;
    let newestActivityDate: Date | null = null;

    for (const activity of activities ?? []) {
      const activityDate = new Date(activity.startDate);
      if (
        oldestActivityDate == null ||
        isBefore(activityDate, oldestActivityDate)
      ) {
        oldestActivityDate = activityDate;
      }
      if (
        newestActivityDate == null ||
        isAfter(activityDate, newestActivityDate)
      ) {
        newestActivityDate = activityDate;
      }
    }

    return {
      oldest: oldestActivityDate,
      newest: newestActivityDate,
    };
  }, [activities]);
