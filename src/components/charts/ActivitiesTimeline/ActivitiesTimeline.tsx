import * as React from "react";

import { BarChartPro } from "@mui/x-charts-pro";
import { format } from "date-fns";

import { useActivitiesQuery } from "~/hooks/useActivitiesQuery";
import { useGroupActivitiesByTimeSlice } from "~/hooks/useGroupActivitiesByTimeSlice";
import { SlicePrecision, useTimeSlices } from "~/hooks/useTimeSlices";

import { METRICS, MetricSelect } from "../../MetricSelect";
import { PrecisionSelect } from "../../PrecisionSelect";
import { ChartThemeProvider } from "../ChartThemeProvider";

export default function ActivitiesTimeline() {
  const [metric, setMetric] = React.useState("distance");
  const [precision, setPrecision] = React.useState<SlicePrecision>("month");
  const activitiesQuery = useActivitiesQuery();

  const slices = useTimeSlices({
    precision,
    activities: activitiesQuery.data,
  });

  const groupedActivities = useGroupActivitiesByTimeSlice({
    activities: activitiesQuery.data,
    slices,
    precision,
  });

  const xAxisData = React.useMemo(
    () => groupedActivities.map((group) => group.date),
    [groupedActivities],
  );

  const series = React.useMemo(() => {
    const metricConfig = METRICS.find((el) => el.value === metric);
    if (!metricConfig) {
      return [];
    }

    const activityTypes = new Set<string>();
    activitiesQuery.data?.forEach((activity) => {
      activityTypes.add(activity.type);
    });

    return Array.from(activityTypes).map((activityType) => ({
      label: activityType,
      data: groupedActivities.map((group) =>
        group.activities.reduce((acc, activity) => {
          if (activity.type === activityType) {
            return metricConfig.getValue(activity) + acc;
          }
          return acc;
        }, 0),
      ),
      stack: "total",
    }));
  }, [groupedActivities, metric, activitiesQuery.data]);

  return (
    <ChartThemeProvider>
      <div className="flex h-96 w-full flex-col rounded-md bg-secondary">
        <div className="flex items-center gap-4 border-b border-border p-4">
          <h3 className="text-sm font-medium">Activities Timeline</h3>
          <MetricSelect value={metric} onValueChange={setMetric} />
          <PrecisionSelect value={precision} onValueChange={setPrecision} />
        </div>
        <div className="flex-1">
          <BarChartPro
            xAxis={[
              {
                id: "time",
                scaleType: "band",
                data: xAxisData,
                valueFormatter: (value: Date) => format(value, "MM/yyyy"),
                zoom: { filterMode: "discard" },
              },
            ]}
            yAxis={[
              {
                valueFormatter: (value: number) =>
                  Math.round(value).toLocaleString(),
              },
            ]}
            series={series}
            margin={{ left: 72, right: 24 }}
          />
        </div>
      </div>
    </ChartThemeProvider>
  );
}
