import { useState } from "react";

import { ExportPanel } from "~/components/liveTraining/ExportPanel";
import { PowerHrChart } from "~/components/liveTraining/PowerHrChart";
import { StatCard } from "~/components/primitives/StatCard";
import { Button } from "~/components/ui/button";
import type { SessionDataPoint, SessionSummary } from "~/sensors/types";
import { formatHumanDuration } from "~/utils/format";
import { msToKmh } from "~/sensors/speedFromPower";

interface CardsPostTrainingProps {
  summary: SessionSummary;
  chartData: SessionDataPoint[];
  dataPoints: SessionDataPoint[];
  ftp: number;
  onReset: () => void;
}

export function CardsPostTraining({
  summary,
  chartData,
  dataPoints,
  ftp,
  onReset,
}: CardsPostTrainingProps) {
  const [activityName, setActivityName] = useState("");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 p-4">
      {/* Hero card */}
      <div className="rounded-2xl border border-gray-700 bg-gradient-to-br from-purple-500/20 to-gray-800 p-6 text-center">
        <h2 className="text-2xl font-bold text-white">Ride Complete</h2>
        <p className="mt-2 font-mono text-4xl font-bold text-white">
          {formatHumanDuration(summary.elapsedSeconds)}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
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
            summary.avgCadence != null
              ? `${summary.avgCadence} rpm`
              : null
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

      {/* Activity name input */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800 p-4">
        <label className="mb-2 block text-xs uppercase tracking-wider text-gray-400">
          Activity Name
        </label>
        <input
          className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-lg text-white"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          placeholder="Name your ride..."
        />
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800 p-3">
        <div className="h-48">
          <PowerHrChart dataPoints={chartData} ftp={ftp} showAll />
        </div>
      </div>

      {/* Export */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800 p-4">
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
      <Button variant="outline" onClick={onReset} className="rounded-xl py-3">
        Start New Session
      </Button>
    </div>
  );
}
