import * as React from "react";

import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";

import { useGroupActivitiesByTimeSlice } from "~/hooks/useGroupActivitiesByTimeSlice";
import { useTimeSlices } from "~/hooks/useTimeSlices";
import { trpc } from "~/utils/trpc";

const PRECISION = "week";

export default function ActivitiesTimeline() {
  const activitiesQuery = trpc.strava.activities.useQuery();

  const slices = useTimeSlices({
    precision: PRECISION,
    activities: activitiesQuery.data,
  });

  const groupedActivities = useGroupActivitiesByTimeSlice({
    activities: activitiesQuery.data,
    slices,
    precision: PRECISION,
  });

  const data = React.useMemo(() => {
    return groupedActivities.map((group) => {
      return {
        date: group.date,
        value: group.activities.reduce(
          (acc, activity) => activity.distance + acc,
          0,
        ),
      };
    });
  }, [groupedActivities]);

  const series = React.useMemo(
    () => [
      {
        name: "Distance",
        type: "bar",
        showSymbol: false,
        data: data.map((item) => [item.date.toDate(), item.value]),
        color: "#f03b20",
      },
    ],
    [data],
  );

  return (
    <ReactECharts
      key={Math.random()}
      className="h-96 w-full"
      option={{
        series,
        grid: {
          left: 72,
          right: 24,
        },
        legend: {
          data: ["Distance"],
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
                  return `${params.value.toLocaleString()}€`;
                }

                return dayjs(params.value).format("MM/YYYY");
              },
            },
          },
          valueFormatter: (value: number) => `${value.toLocaleString()}€`,
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
              formatter: (value: number) => `${value.toLocaleString()}€`,
            },
          },
        ],
      }}
    />
  );
}
