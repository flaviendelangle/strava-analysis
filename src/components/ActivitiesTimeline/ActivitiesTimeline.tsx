import * as React from "react";

import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";
import colors from "tailwindcss/colors";

import { useGroupActivitiesByTimeSlice } from "~/hooks/useGroupActivitiesByTimeSlice";
import { SlicePrecision, useTimeSlices } from "~/hooks/useTimeSlices";
import { trpc } from "~/utils/trpc";

import { METRICS, MetricSelect } from "../MetricSelect";
import { PrecisionSelect } from "../PrecisionSelect";

export default function ActivitiesTimeline() {
  const [metric, setMetric] = React.useState("distance");
  const [precision, setPrecision] = React.useState<SlicePrecision>("month");
  const activitiesQuery = trpc.strava.activities.useQuery();

  const slices = useTimeSlices({
    precision,
    activities: activitiesQuery.data,
  });

  const groupedActivities = useGroupActivitiesByTimeSlice({
    activities: activitiesQuery.data,
    slices,
    precision,
  });

  const series = React.useMemo(() => {
    const metricConfig = METRICS.find((el) => el.value === metric);
    if (!metricConfig) {
      return [];
    }

    return [
      {
        name: metricConfig.label,
        type: "bar",
        showSymbol: false,
        data: groupedActivities.map((group) => [
          group.date.toDate(),
          Math.floor(
            group.activities.reduce(
              (acc, activity) => metricConfig.getValue(activity) + acc,
              0,
            ),
          ),
        ]),
        color: "#f03b20",
      },
    ];
  }, [groupedActivities, metric]);

  return (
    <div className="flex h-96 w-full flex-col rounded-md bg-gray-900">
      <div className="flex gap-4 border-b border-gray-600 p-4">
        <MetricSelect value={metric} onValueChange={setMetric} />
        <PrecisionSelect value={precision} onValueChange={setPrecision} />
      </div>
      <div className="flex-1">
        <ReactECharts
          style={{ height: "100%" }}
          option={{
            theme: "dark",
            color: [
              "#ffa600",
              "#ff7c43",
              "#f95d6a",
              "#d45087",
              "#a05195",
              "#665191",
              "#2f4b7c",
              "#003f5c",
            ],
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

                    return dayjs(params.value).format("MM/YYYY");
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
                type: "time",
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
