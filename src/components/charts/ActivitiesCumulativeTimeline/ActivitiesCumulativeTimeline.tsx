import * as React from "react";

import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";
import { validateHeaderValue } from "http";
import colors from "tailwindcss/colors";

import { useActivitiesQuery } from "~/hooks/trpc/useActivitiesQuery";
import {
  GroupedActivities,
  useGroupActivitiesByTimeSlice,
} from "~/hooks/useGroupActivitiesByTimeSlice";
import { useTimeSlices } from "~/hooks/useTimeSlices";

import { METRICS, MetricSelect } from "../../MetricSelect";

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
        const year = group.date.year();
        if (!acc[year]) {
          acc[year] = [];
        }

        acc[year].push(group);

        return acc;
      },
      {} as Record<string, GroupedActivities>,
    );

    const years = Object.keys(groupedPerYearActivities).sort();

    return years.map((year) => ({
      name: year,
      type: "line",
      showSymbol: false,
      smooth: true,
      data: groupedPerYearActivities[year].map((group) => [
        group.date.month(),
        group.activities.reduce(
          (acc, activity) => metricConfig.getValue(activity) + acc,
          0,
        ),
      ]),
    }));
  }, [groupedActivities, metric]);

  return (
    <div className="flex h-96 w-full flex-col rounded-md bg-gray-900">
      <div className="flex gap-4 border-b border-gray-600 p-4">
        <MetricSelect value={metric} onValueChange={setMetric} />
      </div>
      <div className="flex-1">
        <ReactECharts
          style={{ height: "100%" }}
          option={{
            theme: "dark",
            textStyle: {
              color: "white",
            },
            tooltip: {
              trigger: "axis",
              axisPointer: {
                type: "cross",
                label: {
                  formatter: (params: {
                    value: number;
                    axisDimension: "x" | "y";
                  }) => {
                    if (params.axisDimension === "y") {
                      return Math.round(params.value).toLocaleString();
                    }

                    return params.value;
                  },
                },
              },
              valueFormatter: (value: number) =>
                Math.round(value).toLocaleString(),
              backgroundColor: colors.gray[900],
              textStyle: {
                color: "white",
              },
            },
            legend: {
              data: ["Distance"],
              textStyle: {
                color: "white",
              },
            },
            label: {
              textStyle: {
                color: "white",
              },
            },
            series,
            grid: {
              left: 72,
              right: 24,
            },
            xAxis: [
              {
                type: "category",
                data: dayjs.months(),
                boundaryGap: false,
              },
            ],
            yAxis: [
              {
                type: "value",
                axisLabel: {
                  formatter: (value: number) =>
                    Math.round(value).toLocaleString(),
                },
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
