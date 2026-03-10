import * as React from "react";

import Link from "next/link";

import type { ActivityInfo } from "./types";

interface TooltipEntry {
  id: string;
  label: string;
  color: string;
  value: number | null;
  unit: string;
  activity: ActivityInfo | null;
}

interface PowerCurveTooltipProps {
  clientX: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  duration: number;
  entries: TooltipEntry[];
  frozen: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return mins === 0
      ? `${hours}h`
      : `${hours}h${mins.toString().padStart(2, "0")}`;
  }
  return secs === 0
    ? `${mins}min`
    : `${mins}m${secs.toString().padStart(2, "0")}s`;
}

function formatValue(value: number, unit: string): string {
  if (unit === "W") return `${Math.round(value)} W`;
  return `${value.toFixed(2)} W/kg`;
}

export const PowerCurveTooltip = React.memo(function PowerCurveTooltip({
  clientX,
  containerRef,
  duration,
  entries,
  frozen,
}: PowerCurveTooltipProps) {
  const containerTop = containerRef.current?.getBoundingClientRect().top ?? 0;

  return (
    <div
      className="border-border bg-popover/95 fixed z-50 rounded-md border px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
      style={{
        left: clientX,
        top: containerTop + 16,
        transform: "translateX(-50%)",
        pointerEvents: frozen ? "auto" : "none",
      }}
    >
      <p className="text-muted-foreground mb-1 text-xs">
        {formatDuration(duration)}
      </p>
      <div className="flex flex-col gap-1">
        {entries.map((entry) => {
          if (entry.value == null) return null;
          return (
            <div
              key={entry.id}
              className="flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <span
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.label}</span>
              <span className="font-medium">
                {formatValue(entry.value, entry.unit)}
              </span>
              {entry.activity && (
                <Link
                  href={`/activities/${entry.activity.activityStravaId}`}
                  className="text-muted-foreground hover:text-foreground text-xs underline"
                >
                  {entry.activity.activityName}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
