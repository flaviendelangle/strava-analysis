import { PowerHrChart } from "~/components/liveTraining/PowerHrChart";
import type { SessionDataPoint } from "~/sensors/types";

import { HudMetricTile } from "./HudMetricTile";
import { HudPowerGauge } from "./HudPowerGauge";
import { HudTopBar } from "./HudTopBar";

interface HudMainViewProps {
  // Live values
  currentPower: number | null;
  currentHr: number | null;
  currentCadence: number | null;
  currentSpeedKmh: number | null;
  distanceKm: number;
  elapsedSeconds: number;
  chartData: SessionDataPoint[];
  ftp: number;
  weightKg: number;
  // Actions
  onPause: () => void;
  onStop: () => void;
}

export function HudMainView({
  currentPower,
  currentHr,
  currentCadence,
  currentSpeedKmh,
  distanceKm,
  elapsedSeconds,
  chartData,
  ftp,
  weightKg,
  onPause,
  onStop,
}: HudMainViewProps) {
  return (
    <div className="from-background to-background absolute inset-0 flex flex-col bg-linear-to-br">
      {/* Top bar */}
      <HudTopBar
        elapsedSeconds={elapsedSeconds}
        distanceKm={distanceKm}
        speedKmh={currentSpeedKmh}
      />

      {/* Main area */}
      <div className="relative flex-1">
        {/* Power gauge — center-left */}
        <div className="absolute top-1/2 left-8 -translate-y-1/2">
          <HudPowerGauge power={currentPower} ftp={ftp} weightKg={weightKg} />
        </div>

        {/* Right metrics stack */}
        <div className="absolute top-6 right-6 flex flex-col gap-3">
          <HudMetricTile
            label="Heart Rate"
            value={currentHr}
            unit="bpm"
            color="#f87171"
          />
          <HudMetricTile
            label="Cadence"
            value={currentCadence != null ? Math.round(currentCadence) : null}
            unit="rpm"
            color="#f472b6"
          />
        </div>

        {/* Session controls — bottom right */}
        <div className="absolute right-6 bottom-4 flex gap-2">
          <button
            onClick={onPause}
            className="border-border/50 bg-card/70 hover:bg-accent/70 flex h-12 w-12 items-center justify-center rounded-xl border text-yellow-400 backdrop-blur-sm transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
          <button
            onClick={onStop}
            className="border-border/50 bg-card/70 hover:bg-accent/70 flex h-12 w-12 items-center justify-center rounded-xl border text-red-400 backdrop-blur-sm transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom chart strip */}
      {chartData.length > 0 && (
        <div className="border-border/30 bg-background/80 h-48 border-t px-4 py-2">
          <PowerHrChart dataPoints={chartData} ftp={ftp} />
        </div>
      )}
    </div>
  );
}
