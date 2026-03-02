import { StatCard } from "~/components/primitives/StatCard";
import type { SessionSummary as SessionSummaryType } from "~/sensors/types";
import { formatHumanDuration } from "~/utils/format";
import { getSportConfig } from "~/utils/sportConfig";

interface SessionSummaryProps {
  summary: SessionSummaryType;
}

const sportConfig = getSportConfig("Ride");

export function SessionSummary(props: SessionSummaryProps) {
  const { summary } = props;

  return (
    <div className="rounded-lg bg-gray-700 p-4">
      <h3 className="mb-3 text-lg font-medium text-white">Session Summary</h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard
          label="Duration"
          value={formatHumanDuration(summary.elapsedSeconds)}
        />
        <StatCard
          label="Distance"
          value={sportConfig.formatPreciseDistance(summary.totalDistance)}
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
          value={summary.avgCadence != null ? `${summary.avgCadence} ${sportConfig.cadenceUnit}` : null}
        />
      </div>
    </div>
  );
}
