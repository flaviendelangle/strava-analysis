import { useState } from "react";

import { ExportPanel } from "~/components/liveTraining/ExportPanel";
import { PowerHrChart } from "~/components/liveTraining/PowerHrChart";
import { StatCard } from "~/components/primitives/StatCard";
import { Button } from "~/components/ui/button";
import { msToKmh } from "~/sensors/speedFromPower";
import type { SessionDataPoint, SessionSummary } from "~/sensors/types";
import { formatHumanDuration } from "~/utils/format";

interface HudPostTrainingProps {
  summary: SessionSummary;
  chartData: SessionDataPoint[];
  dataPoints: SessionDataPoint[];
  ftp: number;
  onReset: () => void;
}

export function HudPostTraining({
  summary,
  chartData,
  dataPoints,
  ftp,
  onReset,
}: HudPostTrainingProps) {
  const [activityName, setActivityName] = useState("");

  return (
    <div className="animate-slide-up border-border/50 bg-background/95 absolute inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t backdrop-blur-lg">
      <div className="mx-auto max-w-4xl p-6">
        {/* Handle bar */}
        <div className="mb-6 flex justify-center">
          <div className="bg-accent h-1 w-12 rounded-full" />
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-foreground text-3xl font-bold">Ride Complete</h2>
          <p className="mt-2 font-mono text-4xl font-bold text-teal-400">
            {formatHumanDuration(summary.elapsedSeconds)}
          </p>
        </div>

        {/* Activity name */}
        <div className="mb-6">
          <label className="text-muted-foreground mb-2 block text-xs tracking-wider uppercase">
            Activity Name
          </label>
          <input
            className="border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary w-full rounded-xl border px-4 py-3 text-lg focus:outline-none"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            placeholder="Name your ride..."
          />
        </div>

        {/* Stats grid */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Avg Power"
            value={summary.avgPower != null ? `${summary.avgPower} W` : null}
          />
          <StatCard
            label="Max Power"
            value={summary.maxPower != null ? `${summary.maxPower} W` : null}
          />
          <StatCard
            label="Normalized"
            value={
              summary.normalizedPower != null
                ? `${summary.normalizedPower} W`
                : null
            }
          />
          <StatCard
            label="Avg HR"
            value={
              summary.avgHeartRate != null
                ? `${summary.avgHeartRate} bpm`
                : null
            }
          />
          <StatCard
            label="Max HR"
            value={
              summary.maxHeartRate != null
                ? `${summary.maxHeartRate} bpm`
                : null
            }
          />
          <StatCard
            label="Distance"
            value={`${(summary.totalDistance / 1000).toFixed(2)} km`}
          />
          <StatCard
            label="Avg Cadence"
            value={
              summary.avgCadence != null ? `${summary.avgCadence} rpm` : null
            }
          />
          <StatCard
            label="Avg Speed"
            value={
              summary.avgSpeed != null
                ? `${msToKmh(summary.avgSpeed).toFixed(1)} km/h`
                : null
            }
          />
        </div>

        {/* Chart */}
        <div className="border-border/50 bg-card/50 mb-6 rounded-xl border p-3">
          <div className="h-48">
            <PowerHrChart dataPoints={chartData} ftp={ftp} showAll />
          </div>
        </div>

        {/* Export */}
        <div className="border-border/50 bg-card/50 mb-6 rounded-xl border p-4">
          <h3 className="text-muted-foreground mb-3 text-sm font-medium uppercase">
            Save & Share
          </h3>
          <ExportPanel
            dataPoints={dataPoints}
            summary={summary}
            activityName={activityName || undefined}
          />
        </div>

        {/* New session */}
        <Button
          variant="outline"
          onClick={onReset}
          className="w-full rounded-xl py-3"
        >
          Start New Session
        </Button>
      </div>
    </div>
  );
}
