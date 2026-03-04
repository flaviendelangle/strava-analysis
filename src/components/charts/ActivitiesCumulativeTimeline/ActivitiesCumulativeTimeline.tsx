import * as React from "react";

import { format, getMonth, getYear } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";

import { LineChart } from "@mui/x-charts-pro";

import { useActivitiesQuery } from "~/hooks/useActivitiesQuery";
import {
  GroupedActivities,
  useGroupActivitiesByTimeSlice,
} from "~/hooks/useGroupActivitiesByTimeSlice";
import { useTimeSlices } from "~/hooks/useTimeSlices";
import { CHART_MARGINS, useChartTokens } from "~/lib/chartTokens";

import { METRICS, MetricSelect } from "../../MetricSelect";
import { ChartThemeProvider } from "../ChartThemeProvider";
import { ChartTooltip } from "../ChartTooltip";

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) =>
  format(new Date(2024, i, 1), "MMMM", { locale: enGB }),
);

export default function ActivitiesCumulativeTimeline() {
  const [metric, setMetric] = React.useState("distance");
  const tokens = useChartTokens();
  const activitiesQuery = useActivitiesQuery();

  const slices = useTimeSlices({
    precision: "month",
    activities: activitiesQuery.data,
  });

  const groupedActivities = useGroupActivitiesByTimeSlice({
    activities: activitiesQuery.data,
    slices,
    precision: "month",
  });

  const metricConfig = METRICS.find((el) => el.value === metric);

  const series = React.useMemo(() => {
    if (!metricConfig) {
      return [];
    }

    const groupedPerYearActivities = groupedActivities.reduce(
      (acc, group) => {
        const year = getYear(group.date);
        if (!acc[year]) {
          acc[year] = [];
        }

        acc[year].push(group);

        return acc;
      },
      {} as Record<string, GroupedActivities>,
    );

    const years = Object.keys(groupedPerYearActivities).sort();

    return years.map((year) => {
      const monthlyData = new Array(12).fill(0);
      groupedPerYearActivities[year].forEach((group) => {
        const monthIndex = getMonth(group.date);
        monthlyData[monthIndex] = group.activities.reduce(
          (acc, activity) => metricConfig.getValue(activity) + acc,
          0,
        );
      });

      return {
        label: year,
        data: monthlyData,
        showMark: false,
        curve: "natural" as const,
      };
    });
  }, [groupedActivities, metricConfig]);

  return (
    <ChartThemeProvider>
      <div className="bg-card flex h-96 w-full flex-col rounded-md">
        <div className="border-border flex items-center gap-4 border-b p-4">
          <h3 className="text-sm font-medium">Cumulative Timeline</h3>
          <MetricSelect value={metric} onValueChange={setMetric} />
        </div>
        <div className="flex-1">
          <LineChart
            xAxis={[
              {
                scaleType: "band",
                data: MONTH_LABELS,
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
