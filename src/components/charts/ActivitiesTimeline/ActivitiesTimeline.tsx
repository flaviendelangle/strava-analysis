import * as React from "react";

import { format } from "date-fns";

import { BarChartPro } from "@mui/x-charts-pro";

import { useActivitiesQuery } from "~/hooks/useActivitiesQuery";
import { useGroupActivitiesByTimeSlice } from "~/hooks/useGroupActivitiesByTimeSlice";
import { SlicePrecision, useTimeSlices } from "~/hooks/useTimeSlices";
import { CHART_MARGINS, useChartTokens } from "~/lib/chartTokens";
import { formatActivityType } from "~/utils/format";

import { METRICS, MetricSelect } from "../../MetricSelect";
import { PrecisionSelect } from "../../PrecisionSelect";
import { ChartThemeProvider } from "../ChartThemeProvider";
import { ChartTooltip } from "../ChartTooltip";

export default function ActivitiesTimeline() {
  const [metric, setMetric] = React.useState("distance");
  const tokens = useChartTokens();
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

  const metricConfig = METRICS.find((el) => el.value === metric);

  const series = React.useMemo(() => {
    if (!metricConfig) {
      return [];
    }

    const activityTypes = new Set<string>();
    activitiesQuery.data?.forEach((activity) => {
      activityTypes.add(activity.type);
    });

    return Array.from(activityTypes).map((activityType) => ({
      label: formatActivityType(activityType),
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
  }, [groupedActivities, metricConfig, activitiesQuery.data]);

  return (
    <ChartThemeProvider>
      <div className="bg-card flex h-96 w-full flex-col rounded-md">
        <div className="border-border flex items-center gap-4 border-b p-4">
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
                valueFormatter: (value: number) => {
                  const formatted = Math.round(value).toLocaleString();
                  return metricConfig?.unit
                    ? `${formatted} ${metricConfig.unit}`
                    : formatted;
                },
              },
            ]}
            series={series}
            colors={tokens.palette}
            grid={{ horizontal: true }}
            margin={CHART_MARGINS.standard}
            slots={{ tooltip: ChartTooltip }}
          />
        </div>
      </div>
    </ChartThemeProvider>
  );
}
