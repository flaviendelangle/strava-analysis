import * as React from "react";

import dayjs from "dayjs";
import { max } from "drizzle-orm";
import ReactECharts from "echarts-for-react";

import { trpc } from "~/utils/trpc";

const STREAMS_TO_PLOT = [
  { type: "heartrate", color: "oklch(0.637 0.237 25.331)" },
  { type: "watts", color: "oklch(0.627 0.265 303.9)" },
  { type: "cadence", color: "oklch(0.656 0.241 354.308)" },
  { type: "velocity_smooth", color: "oklch(0.707 0.165 254.624)" },
];

export default function ActivitiesStream(props: ActivitiesStreamProps) {
  const { id } = props;

  const activityQuery = trpc.activities.getActivityWithMap.useQuery({ id });

  const activityStreamsQuery = trpc.activities.getActivityStreams.useQuery({
    id,
  });

  const streams = React.useMemo(() => {
    if (!activityQuery.data || !activityStreamsQuery.data) {
      return [];
    }

    const startDate = dayjs(activityQuery.data.startDateLocal);

    return STREAMS_TO_PLOT.map((streamConfig) => {
      const stream = activityStreamsQuery.data?.find(
        (element) => element.type === streamConfig.type,
      );
      if (!stream) {
        return null;
      }

      return {
        name: stream.type,
        type: "line",
        showSymbol: false,
        color: streamConfig.color,
        data: (stream.data as number[]).map((el, index) => [
          startDate.add(index, "second").toDate(),
          el,
        ]),
      };
    }).filter((stream) => stream !== null);
  }, [activityStreamsQuery.data]);

  return (
    <div className="flex flex-col rounded-md bg-gray-700">
      {streams.map((stream) => (
        <div className="h-48">
          <ReactECharts
            style={{ height: "100%" }}
            option={{
              series: [stream],
              xAxis: {
                type: "time",
              },
              yAxis: {
                type: "value",
                min: "dataMin",
                max: "dataMax",
              },
              textStyle: {
                color: "white",
              },
              legend: {
                textStyle: {
                  color: "white",
                },
              },
              grid: {
                left: 48,
                right: 24,
                top: 32,
                bottom: 32,
              },
            }}
          />
        </div>
      ))}
    </div>
  );
}

interface ActivitiesStreamProps {
  id: number;
}
