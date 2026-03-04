import * as React from "react";

import type { PreparedStream } from "./types";

interface CrosshairProps {
  hoverIndex: number;
  clientPos: { x: number; y: number };
  streams: PreparedStream[];
  xValue: number;
  formatX: (value: number) => string;
}

export const Crosshair = React.memo(function Crosshair(props: CrosshairProps) {
  const { hoverIndex, clientPos, streams, xValue, formatX } = props;

  return (
    <div
      className="border-border bg-popover/95 pointer-events-none fixed z-50 rounded-md border px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
      style={{
        left: clientPos.x + 12,
        top: clientPos.y - 12,
        transform: "translateY(-100%)",
      }}
    >
      <div className="text-popover-foreground mb-1.5 font-medium">
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
            <span className="text-muted-foreground">
              {stream.config.title}:
            </span>
            <span className="text-popover-foreground font-medium">
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
