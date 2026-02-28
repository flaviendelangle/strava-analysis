import { useEffect, useRef } from "react";

import type { EChartsInstance } from "echarts-for-react";
import ReactECharts from "echarts-for-react";

import type { SessionDataPoint } from "~/sensors/types";
import { getPowerZoneColor } from "~/sensors/types";

const WINDOW_SECONDS = 600; // 10 minutes

interface PowerHrChartProps {
  dataPoints: SessionDataPoint[];
  ftp: number;
  /** Show all data instead of a rolling window (for post-session view) */
  showAll?: boolean;
}

export function PowerHrChart(props: PowerHrChartProps) {
  const { dataPoints, ftp, showAll = false } = props;
  const chartRef = useRef<EChartsInstance | null>(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const points = showAll
      ? dataPoints
      : dataPoints.slice(-WINDOW_SECONDS);

    const powerData = points.map((p, i) => [i, p.power ?? 0]);
    const hrData = points.map((p, i) => [i, p.heartRate ?? 0]);
    const powerColors = points.map((p) =>
      p.power != null && p.power > 0
        ? getPowerZoneColor(p.power, ftp)
        : "#808080",
    );

    // Compute time labels relative to now
    const totalPoints = points.length;
    const xLabels = points.map((_, i) => {
      const secsAgo = totalPoints - 1 - i;
      if (secsAgo === 0) return "now";
      const min = Math.floor(secsAgo / 60);
      const sec = secsAgo % 60;
      return `-${min}:${String(sec).padStart(2, "0")}`;
    });

    chart.setOption(
      {
        xAxis: {
          type: "category",
          data: xLabels,
          axisLabel: {
            color: "#9CA3AF",
            fontSize: 10,
            interval: showAll ? Math.floor(totalPoints / 6) : 59, // label every minute
          },
          axisTick: { show: false },
          axisLine: { show: false },
          splitLine: { show: false },
        },
        yAxis: [
          {
            type: "value",
            name: "W",
            nameTextStyle: { color: "#9CA3AF", fontSize: 10 },
            axisLabel: { color: "#9CA3AF", fontSize: 10 },
            splitLine: { lineStyle: { color: "#374151", type: "dashed" } },
            min: 0,
          },
          {
            type: "value",
            name: "bpm",
            nameTextStyle: { color: "#9CA3AF", fontSize: 10 },
            axisLabel: { color: "#9CA3AF", fontSize: 10 },
            splitLine: { show: false },
            min: 60,
            max: 200,
          },
        ],
        series: [
          {
            name: "Power",
            type: "bar",
            data: powerData,
            barWidth: "100%",
            barCategoryGap: "0%",
            itemStyle: {
              color: (params: { dataIndex: number }) =>
                powerColors[params.dataIndex],
            },
            yAxisIndex: 0,
          },
          {
            name: "Heart Rate",
            type: "line",
            data: hrData,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: "#EF4444", width: 2 },
            itemStyle: { color: "#EF4444" },
            yAxisIndex: 1,
          },
        ],
        grid: {
          left: 40,
          right: 40,
          top: 20,
          bottom: 24,
        },
        tooltip: { show: false },
        animation: false,
      },
      true, // notMerge: replace the entire option
    );
  }, [dataPoints, ftp, showAll]);

  return (
    <ReactECharts
      ref={(e: { getEchartsInstance: () => EChartsInstance } | null) => {
        chartRef.current = e?.getEchartsInstance() ?? null;
      }}
      style={{ height: 200, width: "100%" }}
      option={{}}
      opts={{ renderer: "canvas" }}
    />
  );
}
