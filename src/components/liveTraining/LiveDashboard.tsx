import { formatElapsed } from "~/utils/format";
import { getSportConfig } from "~/utils/sportConfig";
import { LiveMetricCard } from "./LiveMetricCard";

interface LiveDashboardProps {
  heartRate: number | null;
  power: number | null;
  cadence: number | null;
  speed: number | null;
  elapsedSeconds: number;
  distanceKm: number;
  ergTargetPower?: number | null;
}

const sportConfig = getSportConfig("Ride");

export function LiveDashboard(props: LiveDashboardProps) {
  const { heartRate, power, cadence, speed, elapsedSeconds, distanceKm, ergTargetPower } =
    props;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <LiveMetricCard
        label="Heart Rate"
        value={heartRate}
        unit="bpm"
        accentColor="#EF4444"
      />
      <LiveMetricCard
        label="Power"
        value={power}
        unit="W"
        accentColor="#9333EA"
        subtitle={ergTargetPower != null ? `Target: ${ergTargetPower}W` : undefined}
      />
      <LiveMetricCard
        label="Cadence"
        value={cadence}
        unit={sportConfig.cadenceUnit}
        accentColor="#EC4899"
      />
      <LiveMetricCard
        label="Speed"
        value={speed != null ? speed.toFixed(1) : null}
        unit="km/h"
        accentColor="#3B82F6"
      />
      <LiveMetricCard
        label="Elapsed"
        value={formatElapsed(elapsedSeconds)}
        unit=""
        accentColor="#FFFFFF"
      />
      <LiveMetricCard
        label="Distance"
        value={distanceKm.toFixed(2)}
        unit="km"
        accentColor="#22C55E"
      />
    </div>
  );
}
