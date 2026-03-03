import * as React from "react";

import {
  BarPlot,
  ChartContainerPro,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
} from "@mui/x-charts-pro";

import type { SessionDataPoint } from "~/sensors/types";
import { getPowerZoneColor } from "~/sensors/types";

import { ChartThemeProvider } from "../charts/ChartThemeProvider";

const WINDOW_SECONDS = 600; // 10 minutes

interface PowerHrChartProps {
  dataPoints: SessionDataPoint[];
  ftp: number;
  /** Show all data instead of a rolling window (for post-session view) */
  showAll?: boolean;
}

export function PowerHrChart(props: PowerHrChartProps) {
  const { dataPoints, ftp, showAll = false } = props;

  const points = showAll ? dataPoints : dataPoints.slice(-WINDOW_SECONDS);

  // MUI X Charts crashes when band-axis data is empty — bail out early.
  if (points.length === 0) {
    return null;
  }

  const xLabels = React.useMemo(() => {
    const totalPoints = points.length;
    return points.map((_, i) => {
      const secsAgo = totalPoints - 1 - i;
      if (secsAgo === 0) return "now";
      const min = Math.floor(secsAgo / 60);
      const sec = secsAgo % 60;
      return `-${min}:${String(sec).padStart(2, "0")}`;
    });
  }, [points]);

  const powerColors = React.useMemo(
    () =>
      points.map((p) =>
        p.power != null && p.power > 0
          ? getPowerZoneColor(p.power, ftp)
          : "#808080",
      ),
    [points, ftp],
  );

  const hasTargetPower = points.some((p) => p.targetPower != null);

  const series = React.useMemo(
    () => [
      {
        type: "bar" as const,
        label: "Power",
        data: points.map((p) => p.power ?? 0),
        yAxisId: "power",
        colorGetter: ({ dataIndex }: { dataIndex: number }) =>
          powerColors[dataIndex],
      },
      {
        type: "line" as const,
        label: "Heart Rate",
        data: points.map((p) => p.heartRate ?? 0),
        yAxisId: "hr",
        color: "#EF4444",
        showMark: false,
        curve: "natural" as const,
      },
      ...(hasTargetPower
        ? [
            {
              type: "line" as const,
              label: "Target",
              data: points.map((p) => p.targetPower ?? null),
              yAxisId: "power",
              color: "#FACC15",
              showMark: false,
              curve: "step" as const,
              connectNulls: false,
            },
          ]
        : []),
    ],
    [points, powerColors, hasTargetPower],
  );

  const totalPoints = points.length;
  const xTickInterval = React.useCallback(
    (_: unknown, index: number) => {
      if (showAll) {
        return index % Math.floor(totalPoints / 6) === 0;
      }
      return index % 60 === 0;
    },
    [showAll, totalPoints],
  );

  return (
    <ChartThemeProvider>
      <ChartContainerPro
        series={series}
        xAxis={[
          {
            id: "x",
            scaleType: "band",
            data: xLabels,
            tickLabelInterval: xTickInterval,
          },
        ]}
        yAxis={[
          {
            id: "power",
            position: "left",
            label: "W",
            min: 0,
          },
          {
            id: "hr",
            position: "right",
            label: "bpm",
            min: 60,
            max: 200,
          },
        ]}
        height={200}
        skipAnimation
        margin={{ left: 40, right: 40, top: 20, bottom: 24 }}
      >
        <BarPlot />
        <LinePlot />
        <ChartsXAxis axisId="x" />
        <ChartsYAxis axisId="power" />
        <ChartsYAxis axisId="hr" />
      </ChartContainerPro>
    </ChartThemeProvider>
  );
}
