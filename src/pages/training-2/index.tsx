import { BrowserCompatibilityBanner } from "~/components/liveTraining/BrowserCompatibilityBanner";
import { PowerHrChart } from "~/components/liveTraining/PowerHrChart";
import { CockpitBottomBar } from "~/components/liveTraining/cockpit/CockpitBottomBar";
import { CockpitConnectionBar } from "~/components/liveTraining/cockpit/CockpitConnectionBar";
import { CockpitMetricPanel } from "~/components/liveTraining/cockpit/CockpitMetricPanel";
import { CockpitPostTraining } from "~/components/liveTraining/cockpit/CockpitPostTraining";
import { useTrainingPageController } from "~/hooks/useTrainingPageController";
import { getPowerZoneColor, getPowerZoneName } from "~/sensors/types";
import { formatElapsed } from "~/utils/format";

type Phase = "connection" | "waiting" | "main" | "paused" | "post";

export default function Training2Page() {
  const ctrl = useTrainingPageController();

  const bothConnected =
    ctrl.hr.state === "connected" && ctrl.trainer.state === "connected";

  const phase: Phase =
    ctrl.session.state === "stopped"
      ? "post"
      : ctrl.session.state === "paused"
        ? "paused"
        : ctrl.session.state === "running"
          ? "main"
          : bothConnected
            ? "waiting"
            : "connection";

  const isPaused = phase === "paused";
  const isActive = phase === "main" || phase === "paused";

  const zoneColor = getPowerZoneColor(
    ctrl.currentPower ?? 0,
    ctrl.riderSettings.ftp,
  );
  const zoneName = getPowerZoneName(
    ctrl.currentPower ?? 0,
    ctrl.riderSettings.ftp,
  );

  // Post-training: full page replacement
  if (phase === "post" && ctrl.recorder.summary) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <CockpitConnectionBar
          hrState={ctrl.hr.state}
          hrDeviceName={ctrl.hr.deviceName}
          hrSource={ctrl.hrSource}
          onHrSourceChange={ctrl.setHrSource}
          onHrConnect={ctrl.hr.connect}
          onHrDisconnect={ctrl.hr.disconnect}
          trainerState={ctrl.trainer.state}
          trainerDeviceName={ctrl.trainer.deviceName}
          trainerSource={ctrl.trainerSource}
          onTrainerSourceChange={ctrl.setTrainerSource}
          onTrainerConnect={ctrl.trainer.connect}
          onTrainerDisconnect={ctrl.trainer.disconnect}
          bothConnected={bothConnected}
        />
        <CockpitPostTraining
          summary={ctrl.recorder.summary}
          chartData={ctrl.chartData}
          dataPoints={ctrl.recorder.getDataPoints()}
          ftp={ctrl.riderSettings.ftp}
          onReset={ctrl.session.reset}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="px-4 pt-2">
        <BrowserCompatibilityBanner />
      </div>

      {/* Connection bar */}
      <CockpitConnectionBar
        hrState={ctrl.hr.state}
        hrDeviceName={ctrl.hr.deviceName}
        hrSource={ctrl.hrSource}
        onHrSourceChange={ctrl.setHrSource}
        onHrConnect={ctrl.hr.connect}
        onHrDisconnect={ctrl.hr.disconnect}
        trainerState={ctrl.trainer.state}
        trainerDeviceName={ctrl.trainer.deviceName}
        trainerSource={ctrl.trainerSource}
        onTrainerSourceChange={ctrl.setTrainerSource}
        onTrainerConnect={ctrl.trainer.connect}
        onTrainerDisconnect={ctrl.trainer.disconnect}
        bothConnected={bothConnected}
      />

      {/* Main content */}
      <div className="relative flex min-h-0 flex-1">
        {/* Left column: stacked metrics */}
        <div
          className={`flex w-80 flex-col gap-2 border-r border-gray-700 p-3 ${
            !isActive ? "opacity-30" : ""
          }`}
        >
          <CockpitMetricPanel
            label="Power"
            value={ctrl.currentPower}
            unit="W"
            size="large"
            accentColor={zoneColor}
            bgColor={ctrl.currentPower != null ? zoneColor : undefined}
            subtitle={ctrl.currentPower != null ? zoneName : undefined}
            isPaused={isPaused}
          />
          <CockpitMetricPanel
            label="Heart Rate"
            value={ctrl.currentHr}
            unit="bpm"
            accentColor="#EF4444"
            isPaused={isPaused}
          />
          <CockpitMetricPanel
            label="Cadence"
            value={
              ctrl.currentCadence != null
                ? Math.round(ctrl.currentCadence)
                : null
            }
            unit="rpm"
            accentColor="#EC4899"
            isPaused={isPaused}
          />
          <CockpitMetricPanel
            label="Speed"
            value={ctrl.currentSpeedKmh?.toFixed(1) ?? null}
            unit="km/h"
            accentColor="#3B82F6"
            isPaused={isPaused}
          />
          <CockpitMetricPanel
            label="Distance"
            value={ctrl.distanceKm.toFixed(2)}
            unit="km"
            accentColor="#22C55E"
            isPaused={isPaused}
          />
          <div className="flex-1" />
          <CockpitMetricPanel
            label="Elapsed"
            value={formatElapsed(ctrl.session.elapsedSeconds)}
            unit=""
            size="medium"
            isPaused={isPaused}
          />
        </div>

        {/* Right area: chart */}
        <div
          className={`flex min-h-0 flex-1 flex-col p-3 ${
            !isActive ? "opacity-30" : ""
          }`}
        >
          <div className="min-h-0 flex-1">
            {ctrl.chartData.length > 0 ? (
              <PowerHrChart
                dataPoints={ctrl.chartData}
                ftp={ctrl.riderSettings.ftp}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-600">
                Chart will appear here during training
              </div>
            )}
          </div>
        </div>

        {/* Waiting overlay */}
        {phase === "waiting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl border border-gray-700 bg-gray-800/90 px-12 py-8 text-center">
              <svg
                className="mx-auto mb-4 h-12 w-12 text-purple-400"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 2v11h3v9l7-12h-4l4-8z" />
              </svg>
              <p className="text-xl font-medium text-gray-300">
                Pedal to start
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Session will begin automatically when power is detected
              </p>
            </div>
          </div>
        )}

        {/* Connection waiting */}
        {phase === "connection" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-medium text-gray-500">
                Connect your devices to begin
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {isActive && (
        <CockpitBottomBar
          sessionState={ctrl.session.state}
          onPause={ctrl.session.pause}
          onResume={ctrl.session.resume}
          onStop={ctrl.handleStop}
          supportsControl={ctrl.ergMode.supportsControl}
          ergEnabled={ctrl.ergMode.ergEnabled}
          setErgEnabled={ctrl.ergMode.setErgEnabled}
          targetPower={ctrl.ergMode.targetPower}
          setTargetPower={ctrl.ergMode.setTargetPower}
        />
      )}
    </div>
  );
}
