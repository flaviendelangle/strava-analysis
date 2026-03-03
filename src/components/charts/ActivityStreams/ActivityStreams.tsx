import * as React from "react";

import { Select } from "~/components/primitives/Select";
import { useAthleteId } from "~/hooks/useAthleteId";
import { getSportConfig } from "~/utils/sportConfig";
import { trpc } from "~/utils/trpc";

import { MultiPanelChart } from "./MultiPanelChart";
import type { PreparedStream, StreamConfig, XAxisMode } from "./types";

const X_AXIS_OPTIONS: { value: XAxisMode; label: string }[] = [
  { value: "time", label: "Time" },
  { value: "distance", label: "Distance" },
];

const STREAMS_TO_PLOT: StreamConfig[] = [
  {
    type: "heartrate",
    title: "Heart rate",
    unit: "bpm",
    color: "oklch(0.637 0.237 25.331)",
    area: false,
  },
  {
    type: "watts",
    title: "Power",
    unit: "W",
    color: "oklch(0.627 0.265 303.9)",
    area: false,
  },
  {
    type: "cadence",
    title: "Cadence",
    unit: "rpm",
    color: "oklch(0.656 0.241 354.308)",
    area: false,
  },
  {
    type: "velocity_smooth",
    title: "Speed",
    unit: "m/s",
    color: "oklch(0.707 0.165 254.624)",
    area: false,
  },
  {
    type: "altitude",
    title: "Altitude",
    unit: "m",
    color: "oklch(0.65 0.15 145)",
    area: true,
  },
];

export default function ActivityStreams(props: ActivityStreamsProps) {
  const { stravaId, onHoverPositionChange } = props;
  const athleteId = useAthleteId();

  const { data: activity } = trpc.activities.get.useQuery({ stravaId });
  const { data: streamsData } = trpc.activityStreams.getStreams.useQuery({
    stravaId,
  });
  const fetchStreams = trpc.activityStreams.fetchStreams.useMutation();
  const [isFetching, setIsFetching] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const hasFetched = React.useRef(false);
  const [xAxisMode, setXAxisMode] = React.useState<XAxisMode>("time");

  React.useEffect(() => {
    if (
      streamsData === null &&
      athleteId &&
      !isFetching &&
      !hasFetched.current
    ) {
      hasFetched.current = true;
      setIsFetching(true);
      setFetchError(null);
      fetchStreams
        .mutateAsync({ stravaId, athleteId })
        .catch((err) => setFetchError(String(err)))
        .finally(() => setIsFetching(false));
    }
  }, [streamsData, athleteId, stravaId, isFetching, fetchStreams]);

  const latlngData = React.useMemo(() => {
    if (!streamsData) return null;
    const latlngStream = streamsData.find((s) => s.type === "latlng");
    if (!latlngStream) return null;
    return JSON.parse(latlngStream.data) as [number, number][];
  }, [streamsData]);

  const handleHoverIndexChange = React.useCallback(
    (index: number | null) => {
      if (!onHoverPositionChange) return;
      if (index === null || !latlngData) {
        onHoverPositionChange(null);
      } else {
        onHoverPositionChange(latlngData[index] ?? null);
      }
    },
    [latlngData, onHoverPositionChange],
  );

  const { streams, distanceData } = React.useMemo(() => {
    if (!activity || !streamsData) {
      return { streams: [], distanceData: null };
    }

    const distanceStream = streamsData.find((s) => s.type === "distance");
    const parsedDistanceData = distanceStream
      ? (JSON.parse(distanceStream.data) as number[])
      : null;

    const preparedStreams = STREAMS_TO_PLOT.map(
      (streamConfig): PreparedStream | null => {
        const stream = streamsData.find(
          (element) => element.type === streamConfig.type,
        );
        if (!stream) {
          return null;
        }

        const yData = JSON.parse(stream.data) as number[];
        let yMin = Infinity;
        let yMax = -Infinity;
        for (const v of yData) {
          if (v < yMin) yMin = v;
          if (v > yMax) yMax = v;
        }
        if (!Number.isFinite(yMin)) yMin = 0;
        if (!Number.isFinite(yMax)) yMax = 1;
        const range = yMax - yMin;
        const padding = range > 0 ? range * 0.05 : 1;

        return {
          config: streamConfig,
          yData,
          yMin: yMin - padding,
          yMax: yMax + padding,
        };
      },
    ).filter((stream): stream is PreparedStream => stream !== null);

    return { streams: preparedStreams, distanceData: parsedDistanceData };
  }, [streamsData, activity]);

  const sportConfig = activity ? getSportConfig(activity.type) : null;
  const distanceAvailable = distanceData != null;

  const xAxisOptions = distanceAvailable
    ? X_AXIS_OPTIONS
    : X_AXIS_OPTIONS.filter((opt) => opt.value !== "distance");

  // Build x-axis data (time indices)
  const xData = React.useMemo(() => {
    if (streams.length === 0) return [];
    return streams[0].yData.map((_, i) => i);
  }, [streams]);

  if (fetchError) {
    return (
      <div className="bg-card rounded-md p-4 text-red-400">
        Failed to load streams: {fetchError}
      </div>
    );
  }

  if (isFetching || streamsData === undefined || streamsData === null) {
    return (
      <div className="bg-card rounded-md p-4 text-gray-400">
        Loading stream data...
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="bg-card rounded-md p-4 text-gray-400">
        No stream data available for this activity.
      </div>
    );
  }

  return (
    <div className="bg-card flex flex-col rounded-md">
      {xAxisOptions.length > 1 && (
        <div className="border-border flex gap-4 border-b p-4">
          <Select
            value={xAxisMode}
            onValueChange={setXAxisMode}
            options={xAxisOptions}
          />
        </div>
      )}
      <MultiPanelChart
        streams={streams}
        xData={xData}
        distanceData={distanceData}
        xAxisMode={xAxisMode}
        sportConfig={sportConfig}
        onHoverIndexChange={handleHoverIndexChange}
      />
    </div>
  );
}

interface ActivityStreamsProps {
  stravaId: number;
  onHoverPositionChange?: (position: [number, number] | null) => void;
}
