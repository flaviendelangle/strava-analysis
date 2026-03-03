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
    <div className="absolute inset-x-0 bottom-0 z-50 max-h-[85vh] animate-slide-up overflow-y-auto rounded-t-3xl border-t border-gray-700/50 bg-gray-900/95 backdrop-blur-lg">
      <div className="mx-auto max-w-4xl p-6">
        {/* Handle bar */}
        <div className="mb-6 flex justify-center">
          <div className="h-1 w-12 rounded-full bg-gray-600" />
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-white">Ride Complete</h2>
          <p className="mt-2 font-mono text-4xl font-bold text-purple-400">
            {formatHumanDuration(summary.elapsedSeconds)}
          </p>
        </div>

        {/* Activity name */}
        <div className="mb-6">
          <label className="mb-2 block text-xs uppercase tracking-wider text-gray-400">
            Activity Name
          </label>
          <input
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-lg text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
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
        <div className="mb-6 rounded-xl border border-gray-700/50 bg-gray-800/50 p-3">
          <div className="h-48">
            <PowerHrChart dataPoints={chartData} ftp={ftp} showAll />
          </div>
        </div>

        {/* Export */}
        <div className="mb-6 rounded-xl border border-gray-700/50 bg-gray-800/50 p-4">
          <h3 className="mb-3 text-sm font-medium uppercase text-gray-400">
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
