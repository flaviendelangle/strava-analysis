import * as React from "react";

import { useAction, useQuery } from "convex/react";
import { addSeconds } from "date-fns";
import ReactECharts from "echarts-for-react";

import { useAthleteId } from "~/hooks/useAthleteId";

import { api } from "../../../../convex/_generated/api";

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

export default function ActivityStreams(props: ActivityStreamsProps) {
  const { stravaId } = props;
  const athleteId = useAthleteId();

  const activity = useQuery(api.queries.getActivity, { stravaId });
  const streamsData = useQuery(api.queries.getActivityStreams, { stravaId });
  const fetchStreams = useAction(api.actions.fetchActivityStreams);
  const [isFetching, setIsFetching] = React.useState(false);

  React.useEffect(() => {
    if (streamsData === null && athleteId && !isFetching) {
      setIsFetching(true);
      fetchStreams({ stravaId, athleteId }).finally(() => setIsFetching(false));
    }
  }, [streamsData, athleteId, stravaId, isFetching, fetchStreams]);

  const streams = React.useMemo(() => {
    if (!activity || !streamsData) {
      return [];
    }

    const startDate = new Date(activity.startDateLocal);

    return STREAMS_TO_PLOT.map((streamConfig) => {
      const stream = streamsData.find(
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
        data: stream.data.map((el, index) => [
          addSeconds(startDate, index),
          el,
        ]),
      };
    }).filter((stream) => stream !== null);
  }, [streamsData, activity]);

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

interface ActivityStreamsProps {
  stravaId: number;
}
