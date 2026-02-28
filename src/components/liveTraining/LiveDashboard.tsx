import { LiveMetricCard } from "./LiveMetricCard";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface LiveDashboardProps {
  heartRate: number | null;
  power: number | null;
  cadence: number | null;
  speed: number | null;
  elapsedSeconds: number;
  distanceKm: number;
}

export function LiveDashboard(props: LiveDashboardProps) {
  const { heartRate, power, cadence, speed, elapsedSeconds, distanceKm } =
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
      />
      <LiveMetricCard
        label="Cadence"
        value={cadence}
        unit="rpm"
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
