import type { SessionSummary as SessionSummaryType } from "~/sensors/types";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2) + " km";
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="rounded-md bg-gray-800 px-3 py-2">
      <div className="text-xs uppercase tracking-wider text-gray-400">
        {label}
      </div>
      <div className="font-mono text-lg font-bold text-white">
        {value ?? "--"}
      </div>
    </div>
  );
}

interface SessionSummaryProps {
  summary: SessionSummaryType;
}

export function SessionSummary(props: SessionSummaryProps) {
  const { summary } = props;

  return (
    <div className="rounded-lg bg-gray-700 p-4">
      <h3 className="mb-3 text-lg font-medium text-white">Session Summary</h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard
          label="Duration"
          value={formatDuration(summary.elapsedSeconds)}
        />
        <StatCard
          label="Distance"
          value={formatDistance(summary.totalDistance)}
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
          value={summary.normalizedPower != null ? `${summary.normalizedPower} W` : null}
        />
        <StatCard
          label="Avg HR"
          value={summary.avgHeartRate != null ? `${summary.avgHeartRate} bpm` : null}
        />
        <StatCard
          label="Max HR"
          value={summary.maxHeartRate != null ? `${summary.maxHeartRate} bpm` : null}
        />
        <StatCard
          label="Avg Cadence"
          value={summary.avgCadence != null ? `${summary.avgCadence} rpm` : null}
        />
      </div>
    </div>
  );
}
