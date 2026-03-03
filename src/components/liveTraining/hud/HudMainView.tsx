import { PowerHrChart } from "~/components/liveTraining/PowerHrChart";
import type { SessionDataPoint } from "~/sensors/types";

import { HudErgPanel } from "./HudErgPanel";
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
  // ERG
  supportsControl: boolean;
  ergEnabled: boolean;
  setErgEnabled: (v: boolean) => void;
  targetPower: number;
  setTargetPower: (v: number) => void;
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
  supportsControl,
  ergEnabled,
  setErgEnabled,
  targetPower,
  setTargetPower,
  onPause,
  onStop,
}: HudMainViewProps) {
  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-gray-900 to-gray-950">
      {/* Top bar */}
      <HudTopBar
        elapsedSeconds={elapsedSeconds}
        distanceKm={distanceKm}
        speedKmh={currentSpeedKmh}
      />

      {/* Main area */}
      <div className="relative flex-1">
        {/* Power gauge — center-left */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2">
          <HudPowerGauge
            power={currentPower}
            ftp={ftp}
            weightKg={weightKg}
          />
        </div>

        {/* Right metrics stack */}
        <div className="absolute right-6 top-6 flex flex-col gap-3">
          <HudMetricTile
            label="Heart Rate"
            value={currentHr}
            unit="bpm"
            color="#f87171"
          />
          <HudMetricTile
            label="Cadence"
            value={
              currentCadence != null ? Math.round(currentCadence) : null
            }
            unit="rpm"
            color="#f472b6"
          />
          {supportsControl && ergEnabled && (
            <HudMetricTile
              label="ERG Target"
              value={targetPower}
              unit="W"
              color="#facc15"
            />
          )}
        </div>

        {/* ERG panel — bottom left */}
        {supportsControl && (
          <div className="absolute bottom-4 left-6">
            <HudErgPanel
              ergEnabled={ergEnabled}
              setErgEnabled={setErgEnabled}
              targetPower={targetPower}
              setTargetPower={setTargetPower}
            />
          </div>
        )}

        {/* Session controls — bottom right */}
        <div className="absolute bottom-4 right-6 flex gap-2">
          <button
            onClick={onPause}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-700/50 bg-gray-800/70 text-yellow-400 backdrop-blur-sm transition-colors hover:bg-gray-700/70"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
          <button
            onClick={onStop}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-700/50 bg-gray-800/70 text-red-400 backdrop-blur-sm transition-colors hover:bg-gray-700/70"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom chart strip */}
      {chartData.length > 0 && (
        <div className="h-48 border-t border-gray-700/30 bg-gray-900/80 px-4 py-2">
          <PowerHrChart dataPoints={chartData} ftp={ftp} />
        </div>
      )}
    </div>
  );
}
