import * as React from "react";

import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";

import { trpc } from "~/utils/trpc";

const STREAMS_TO_PLOT = [
  {
    type: "heartrate",
    title: "Heart rate (BPM)",
    color: "oklch(0.637 0.237 25.331)",
  },
  { type: "watts", title: "Power (watts)", color: "oklch(0.627 0.265 303.9)" },
  {
    type: "cadence",
    title: "Cadence (RPM)",
    color: "oklch(0.656 0.241 354.308)",
  },
  {
    type: "velocity_smooth",
    title: "Speed (m/s)",
    color: "oklch(0.707 0.165 254.624)",
  },
];

export default function ActivityStreams(props: ActivityStreams) {
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
        name: streamConfig.title,
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
        <article className="flex h-48" key={stream.name}>
          <h4
            className="rotate-180 transform cursor-default text-center"
            style={{ writingMode: "vertical-rl" }}
          >
            {stream.name}
          </h4>
          <div className="flex-1">
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
                grid: {
                  left: 36,
                  right: 24,
                  top: 32,
                  bottom: 32,
                },
              }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

interface ActivityStreams {
  id: number;
}
