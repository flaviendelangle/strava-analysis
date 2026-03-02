import * as React from "react";

import { LineChart } from "@mui/x-charts-pro";
import { format, getMonth, getYear } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";

import { useActivitiesQuery } from "~/hooks/useActivitiesQuery";
import {
  GroupedActivities,
  useGroupActivitiesByTimeSlice,
} from "~/hooks/useGroupActivitiesByTimeSlice";
import { useTimeSlices } from "~/hooks/useTimeSlices";

import { METRICS, MetricSelect } from "../../MetricSelect";
import { ChartThemeProvider } from "../ChartThemeProvider";

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) =>
  format(new Date(2024, i, 1), "MMMM", { locale: enGB }),
);

const COLORS = [
  "#818cf8", // indigo-400
  "#34d399", // emerald-400
  "#fb923c", // orange-400
  "#f472b6", // pink-400
  "#38bdf8", // sky-400
  "#a78bfa", // violet-400
  "#fbbf24", // amber-400
];

export default function ActivitiesCumulativeTimeline() {
  const [metric, setMetric] = React.useState("distance");
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

  const series = React.useMemo(() => {
    const metricConfig = METRICS.find((el) => el.value === metric);
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
  }, [groupedActivities, metric]);

  return (
    <ChartThemeProvider>
      <div className="flex h-96 w-full flex-col rounded-md bg-secondary">
        <div className="flex gap-4 border-b border-border p-4">
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
                valueFormatter: (value: number) =>
                  Math.round(value).toLocaleString(),
              },
            ]}
            series={series}
            colors={COLORS}
            margin={{ left: 72, right: 24 }}
          />
        </div>
      </div>
    </ChartThemeProvider>
  );
}
