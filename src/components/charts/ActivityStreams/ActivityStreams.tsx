import * as React from "react";

import { Select } from "~/components/primitives/Select";
import { useAthleteId } from "~/hooks/useAthleteId";
import { useChartTokens } from "~/lib/chartTokens";
import { getSportConfig } from "~/utils/sportConfig";
import { trpc } from "~/utils/trpc";

import { MultiPanelChart } from "./MultiPanelChart";
import type { PreparedStream, XAxisMode } from "./types";

const X_AXIS_OPTIONS: { value: XAxisMode; label: string }[] = [
  { value: "time", label: "Time" },
  { value: "distance", label: "Distance" },
];

interface StreamDef {
  type: string;
  title: string;
  unit: string;
  /** Index into the chart token palette */
  colorIndex: number;
  area: boolean;
}

const STREAM_DEFS: StreamDef[] = [
  {
    type: "heartrate",
    title: "Heart rate",
    unit: "bpm",
    colorIndex: 0,
    area: false,
  },
  { type: "watts", title: "Power", unit: "W", colorIndex: 1, area: false },
  {
    type: "cadence",
    title: "Cadence",
    unit: "rpm",
    colorIndex: 2,
    area: false,
  },
  {
    type: "velocity_smooth",
    title: "Speed",
    unit: "m/s",
    colorIndex: 3,
    area: false,
  },
  { type: "altitude", title: "Altitude", unit: "m", colorIndex: 4, area: true },
];

function parseStreamData(data: string): number[] | null {
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function ActivityStreams(props: ActivityStreamsProps) {
  const { stravaId, onHoverPositionChange } = props;
  const athleteId = useAthleteId();
  const tokens = useChartTokens();

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

  // Parse stream JSON once — only re-runs when raw stream data changes
  const parsedStreams = React.useMemo(() => {
    if (!streamsData) return null;

    const distanceStream = streamsData.find((s) => s.type === "distance");
    const distanceData = distanceStream
      ? parseStreamData(distanceStream.data)
      : null;

    const parsed = STREAM_DEFS.map((def) => {
      const stream = streamsData.find((element) => element.type === def.type);
      if (!stream) return null;

      const yData = parseStreamData(stream.data);
      if (!yData) return null;

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

      return { def, yData, yMin: yMin - padding, yMax: yMax + padding };
    }).filter(
      (s): s is { def: StreamDef; yData: number[]; yMin: number; yMax: number } =>
        s !== null,
    );

    return { parsed, distanceData };
  }, [streamsData]);

  // Assemble final streams with color tokens — cheap, re-runs on theme change
  const { streams, distanceData } = React.useMemo(() => {
    if (!activity || !parsedStreams || tokens.paletteOklch.length === 0) {
      return { streams: [], distanceData: null };
    }

    const preparedStreams: PreparedStream[] = parsedStreams.parsed.map(
      ({ def, yData, yMin, yMax }) => ({
        config: {
          type: def.type,
          title: def.title,
          unit: def.unit,
          color: tokens.palette[def.colorIndex] ?? tokens.palette[0],
          area: def.area,
        },
        yData,
        yMin,
        yMax,
      }),
    );

    return { streams: preparedStreams, distanceData: parsedStreams.distanceData };
  }, [parsedStreams, activity, tokens.palette]);

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
      <div className="bg-card text-muted-foreground rounded-md p-4">
        Loading stream data...
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="bg-card text-muted-foreground rounded-md p-4">
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
