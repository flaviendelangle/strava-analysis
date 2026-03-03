import { useState } from "react";

import { ExportPanel } from "~/components/liveTraining/ExportPanel";
import { PowerHrChart } from "~/components/liveTraining/PowerHrChart";
import { StatCard } from "~/components/primitives/StatCard";
import { Button } from "~/components/ui/button";
import type { SessionDataPoint, SessionSummary } from "~/sensors/types";
import { msToKmh } from "~/sensors/speedFromPower";
import { formatHumanDuration } from "~/utils/format";

interface CockpitPostTrainingProps {
  summary: SessionSummary;
  chartData: SessionDataPoint[];
  dataPoints: SessionDataPoint[];
  ftp: number;
  onReset: () => void;
}

export function CockpitPostTraining({
  summary,
  chartData,
  dataPoints,
  ftp,
  onReset,
}: CockpitPostTrainingProps) {
  const [activityName, setActivityName] = useState("");

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6">
      <h2 className="text-xl font-bold text-white">Session Summary</h2>

      <input
        className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-lg text-white"
        placeholder="Name your ride..."
        value={activityName}
        onChange={(e) => setActivityName(e.target.value)}
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Duration"
          value={formatHumanDuration(summary.elapsedSeconds)}
        />
        <StatCard
          label="Distance"
          value={`${(summary.totalDistance / 1000).toFixed(2)} km`}
        />
        <StatCard
          label="Avg Power"
          value={summary.avgPower != null ? `${summary.avgPower} W` : null}
        />
        <StatCard
          label="Max Power"
          value={summary.maxPower != null ? `${summary.maxPower} W` : null}
        />
        <StatCard
          label="Normalized Power"
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

      <div className="h-64">
        <PowerHrChart dataPoints={chartData} ftp={ftp} showAll />
      </div>

      <ExportPanel
        dataPoints={dataPoints}
        summary={summary}
        activityName={activityName || undefined}
      />

      <Button variant="outline" onClick={onReset} className="mt-4">
        Start New Session
      </Button>
    </div>
  );
}
