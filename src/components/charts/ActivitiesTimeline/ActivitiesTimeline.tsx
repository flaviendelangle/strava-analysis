import * as React from "react";

import { format } from "date-fns";
import ReactECharts from "echarts-for-react";

import { useActivitiesQuery } from "~/hooks/useActivitiesQuery";
import { useGroupActivitiesByTimeSlice } from "~/hooks/useGroupActivitiesByTimeSlice";
import { SlicePrecision, useTimeSlices } from "~/hooks/useTimeSlices";

import { METRICS, MetricSelect } from "../../MetricSelect";
import { PrecisionSelect } from "../../PrecisionSelect";

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

  const series = React.useMemo(() => {
    const metricConfig = METRICS.find((el) => el.value === metric);
    if (!metricConfig) {
      return [];
    }

    const activityTypes = new Set<string>();
    activitiesQuery.data?.forEach((activity) => {
      if (!activityTypes.has(activity.type)) {
        activityTypes.add(activity.type);
      }
    });

    return Array.from(activityTypes).map((activityType) => {
      return {
        name: `${metricConfig.label} - ${activityType}`,
        type: "bar",
        showSymbol: false,
        stack: "x",
        data: groupedActivities.map((group) => [
          group.date,
          group.activities.reduce((acc, activity) => {
            if (activity.type === activityType) {
              return metricConfig.getValue(activity) + acc;
            }

            return acc;
          }, 0),
        ]),
      };
    });
  }, [groupedActivities, metric, activitiesQuery.data]);

  return (
    <div className="flex h-96 w-full flex-col rounded-md bg-secondary">
      <div className="flex gap-4 border-b border-border p-4">
        <MetricSelect value={metric} onValueChange={setMetric} />
        <PrecisionSelect value={precision} onValueChange={setPrecision} />
      </div>
      <div className="flex-1">
        <ReactECharts
          style={{ height: "100%" }}
          option={{
            theme: "dark",
            // color: [
            //   "#ffa600",
            //   "#ff7c43",
            //   "#f95d6a",
            //   "#d45087",
            //   "#a05195",
            //   "#665191",
            //   "#2f4b7c",
            //   "#003f5c",
            // ],
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

                    return format(new Date(params.value), "MM/yyyy");
                  },
                },
              },
              valueFormatter: (value: number) =>
                Math.round(value).toLocaleString(),
              backgroundColor: "#111827",
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
