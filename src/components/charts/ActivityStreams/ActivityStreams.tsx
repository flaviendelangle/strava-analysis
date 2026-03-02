import * as React from "react";

import { LineChart } from "@mui/x-charts-pro";
import { useAction, useQuery } from "convex/react";
import { addSeconds } from "date-fns";

import { Select } from "~/components/primitives/Select";
import { useAthleteId } from "~/hooks/useAthleteId";
import { getSportConfig } from "~/utils/sportConfig";

import { api } from "../../../../convex/_generated/api";
import { ChartThemeProvider } from "../ChartThemeProvider";

type XAxisMode = "time" | "distance";

const X_AXIS_OPTIONS: { value: XAxisMode; label: string }[] = [
  { value: "time", label: "Time" },
  { value: "distance", label: "Distance" },
];

const STREAMS_TO_PLOT = [
  {
    type: "heartrate",
    title: "Heart rate (BPM)",
    color: "oklch(0.637 0.237 25.331)",
    area: false,
  },
  {
    type: "watts",
    title: "Power (watts)",
    color: "oklch(0.627 0.265 303.9)",
    area: false,
  },
  {
    type: "cadence",
    title: "Cadence (RPM)",
    color: "oklch(0.656 0.241 354.308)",
    area: false,
  },
  {
    type: "velocity_smooth",
    title: "Speed (m/s)",
    color: "oklch(0.707 0.165 254.624)",
    area: false,
  },
  {
    type: "altitude",
    title: "Altitude (m)",
    color: "oklch(0.65 0.15 145)",
    area: true,
  },
];

export default function ActivityStreams(props: ActivityStreamsProps) {
  const { stravaId } = props;
  const athleteId = useAthleteId();

  const activity = useQuery(api.queries.getActivity, { stravaId });
  const streamsData = useQuery(api.queries.getActivityStreams, { stravaId });
  const fetchStreams = useAction(api.actions.fetchActivityStreams);
  const [isFetching, setIsFetching] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const hasFetched = React.useRef(false);
  const [xAxisMode, setXAxisMode] = React.useState<XAxisMode>("time");

  React.useEffect(() => {
    if (streamsData === null && athleteId && !isFetching && !hasFetched.current) {
      hasFetched.current = true;
      setIsFetching(true);
      setFetchError(null);
      fetchStreams({ stravaId, athleteId })
        .catch((err) => setFetchError(String(err)))
        .finally(() => setIsFetching(false));
    }
  }, [streamsData, athleteId, stravaId, isFetching, fetchStreams]);

  console.log("[ActivityStreams] state:", {
    stravaId,
    athleteId,
    activity: activity ? "loaded" : activity,
    streamsData:
      streamsData === undefined
        ? "undefined"
        : streamsData === null
          ? "null"
          : `array(${streamsData.length}) types=[${streamsData.map((s) => s.type).join(",")}]`,
    isFetching,
    fetchError,
  });

  const { charts, distanceData } = React.useMemo(() => {
    if (!activity || !streamsData) {
      return { charts: [], distanceData: null };
    }

    const startDate = new Date(activity.startDateLocal);

    const distanceStream = streamsData.find((s) => s.type === "distance");
    const parsedDistanceData = distanceStream
      ? (JSON.parse(distanceStream.data) as number[])
      : null;

    const parsedCharts = STREAMS_TO_PLOT.map((streamConfig) => {
      const stream = streamsData.find(
        (element) => element.type === streamConfig.type,
      );
      if (!stream) {
        return null;
      }

      const yData = JSON.parse(stream.data) as number[];
      let yMin = Infinity;
      let yMax = -Infinity;
      for (let i = 0; i < yData.length; i++) {
        const v = yData[i];
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
      if (!Number.isFinite(yMin)) yMin = 0;
      if (!Number.isFinite(yMax)) yMax = 1;
      const range = yMax - yMin;
      const padding = range > 0 ? range * 0.05 : 1;

      return {
        name: streamConfig.title,
        color: streamConfig.color,
        area: streamConfig.area,
        timeXData: yData.map((_, index) => addSeconds(startDate, index)),
        yData,
        yMin: yMin - padding,
        yMax: yMax + padding,
      };
    }).filter((stream) => stream !== null);

    return { charts: parsedCharts, distanceData: parsedDistanceData };
  }, [streamsData, activity]);

  const sportConfig = activity ? getSportConfig(activity.type) : null;
  const distanceAvailable = distanceData != null;

  const xAxisOptions = distanceAvailable
    ? X_AXIS_OPTIONS
    : X_AXIS_OPTIONS.filter((opt) => opt.value !== "distance");

  if (fetchError) {
    return (
      <div className="rounded-md bg-card p-4 text-red-400">
        Failed to load streams: {fetchError}
      </div>
    );
  }

  if (isFetching || streamsData === undefined || streamsData === null) {
    return (
      <div className="rounded-md bg-card p-4 text-gray-400">
        Loading stream data...
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className="rounded-md bg-card p-4 text-gray-400">
        No stream data available for this activity.
      </div>
    );
  }

  return (
    <ChartThemeProvider>
      <div className="flex flex-col rounded-md bg-card">
        {xAxisOptions.length > 1 && (
          <div className="flex gap-4 border-b border-border p-4">
            <Select
              value={xAxisMode}
              onValueChange={setXAxisMode}
              options={xAxisOptions}
            />
          </div>
        )}
        {charts.map((stream) => (
          <article className="flex h-48" key={stream.name}>
            <h4
              className="rotate-180 transform cursor-default text-center"
              style={{ writingMode: "vertical-rl" }}
            >
              {stream.name}
            </h4>
            <div className="flex-1">
              <LineChart
                xAxis={[
                  xAxisMode === "time"
                    ? {
                        scaleType: "time" as const,
                        data: stream.timeXData,
                      }
                    : {
                        scaleType: "linear" as const,
                        data: distanceData!,
                        valueFormatter: (value: number) =>
                          sportConfig?.formatPreciseDistance(value) ??
                          `${(value / 1000).toFixed(1)} km`,
                      },
                ]}
                yAxis={[{ min: stream.yMin, max: stream.yMax }]}
                series={[
                  {
                    data: stream.yData,
                    showMark: false,
                    color: stream.color,
                    area: stream.area,
                  },
                ]}
                margin={{ left: 36, right: 24, top: 32, bottom: 32 }}
              />
            </div>
          </article>
        ))}
      </div>
    </ChartThemeProvider>
  );
}

interface ActivityStreamsProps {
  stravaId: number;
}
