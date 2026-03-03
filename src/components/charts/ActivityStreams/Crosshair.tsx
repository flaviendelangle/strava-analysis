import * as React from "react";

import type { PreparedStream } from "./types";

interface CrosshairProps {
  hoverIndex: number;
  clientPos: { x: number; y: number };
  streams: PreparedStream[];
  xValue: number;
  formatX: (value: number) => string;
}

export const Crosshair = React.memo(function Crosshair(
  props: CrosshairProps,
) {
  const { hoverIndex, clientPos, streams, xValue, formatX } = props;

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-md border border-zinc-700 bg-zinc-900/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
      style={{
        left: clientPos.x + 12,
        top: clientPos.y - 12,
        transform: "translateY(-100%)",
      }}
    >
      <div className="mb-1.5 font-medium text-zinc-300">
        {formatX(xValue)}
      </div>
      {streams.map((stream) => {
        const value = stream.yData[hoverIndex];
        if (value === undefined) return null;
        return (
          <div
            key={stream.config.type}
            className="flex items-center gap-2 py-0.5"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: stream.config.color }}
            />
            <span className="text-zinc-400">{stream.config.title}:</span>
            <span className="font-medium text-zinc-200">
              {formatValue(value, stream.config.unit)}
            </span>
          </div>
        );
      })}
    </div>
  );
});

function formatValue(value: number, unit: string): string {
  if (unit === "bpm" || unit === "rpm" || unit === "W") {
    return `${Math.round(value)} ${unit}`;
  }
  if (unit === "m") {
    return `${value.toFixed(1)} ${unit}`;
  }
  if (unit === "m/s") {
    return `${(value * 3.6).toFixed(1)} km/h`;
  }
  return `${value.toFixed(1)} ${unit}`;
}
