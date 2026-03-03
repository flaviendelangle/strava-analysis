import { useEffect, useRef, useState } from "react";

import { BrowserCompatibilityBanner } from "~/components/liveTraining/BrowserCompatibilityBanner";
import { PowerHrChart } from "~/components/liveTraining/PowerHrChart";
import { CardsConnectionSetup } from "~/components/liveTraining/cards/CardsConnectionSetup";
import { CardsErgCard } from "~/components/liveTraining/cards/CardsErgCard";
import { CardsMetricCard } from "~/components/liveTraining/cards/CardsMetricCard";
import { CardsPauseModal } from "~/components/liveTraining/cards/CardsPauseModal";
import { CardsPowerHero } from "~/components/liveTraining/cards/CardsPowerHero";
import { CardsPostTraining } from "~/components/liveTraining/cards/CardsPostTraining";
import { CardsWaitingScreen } from "~/components/liveTraining/cards/CardsWaitingScreen";
import { Button } from "~/components/ui/button";
import { useTrainingPageController } from "~/hooks/useTrainingPageController";
import { formatElapsed } from "~/utils/format";

type Phase = "connection" | "waiting" | "main" | "paused" | "post";

export default function Training3Page() {
  const ctrl = useTrainingPageController();

  // Determine the current phase
  const phase: Phase =
    ctrl.session.state === "stopped"
      ? "post"
      : ctrl.session.state === "paused"
        ? "paused"
        : ctrl.session.state === "running"
          ? "main"
          : ctrl.hr.state === "connected" &&
              ctrl.trainer.state === "connected"
            ? "waiting"
            : "connection";

  // Track paused duration for the pause modal
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const pauseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (ctrl.session.state === "paused") {
      setPausedSeconds(0);
      pauseTimerRef.current = setInterval(() => {
        setPausedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (pauseTimerRef.current) {
        clearInterval(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
    }
    return () => {
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    };
  }, [ctrl.session.state]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="p-4">
        <BrowserCompatibilityBanner />
      </div>

      {/* Connection screen */}
      {phase === "connection" && (
        <CardsConnectionSetup
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
        />
      )}

      {/* Waiting screen */}
      {phase === "waiting" && (
        <CardsWaitingScreen
          currentHr={ctrl.currentHr}
          hrConnected={ctrl.hr.state === "connected"}
          onManualStart={() => {
            ctrl.recorder.clear();
            ctrl.session.start();
          }}
        />
      )}

      {/* Main training UI + paused state */}
      {(phase === "main" || phase === "paused") && (
        <div
          className={
            phase === "paused" ? "opacity-70 saturate-50" : undefined
          }
        >
          <div className="mx-auto flex max-w-2xl flex-col gap-3 p-4">
            {/* Hero power card */}
            <CardsPowerHero
              power={ctrl.currentPower}
              ftp={ctrl.riderSettings.ftp}
              weightKg={ctrl.riderSettings.weightKg}
            />

            {/* HR + Cadence */}
            <div className="grid grid-cols-2 gap-3">
              <CardsMetricCard
                label="Heart Rate"
                value={ctrl.currentHr}
                unit="bpm"
                icon={
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                }
                gradient="from-red-500/20 to-red-900/10"
              />
              <CardsMetricCard
                label="Cadence"
                value={
                  ctrl.currentCadence != null
                    ? Math.round(ctrl.currentCadence)
                    : null
                }
                unit="rpm"
                icon={
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6" />
                  </svg>
                }
                gradient="from-pink-500/20 to-pink-900/10"
              />
            </div>

            {/* Speed + Distance */}
            <div className="grid grid-cols-2 gap-3">
              <CardsMetricCard
                label="Speed"
                value={ctrl.currentSpeedKmh?.toFixed(1) ?? null}
                unit="km/h"
                icon={
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z" />
                  </svg>
                }
                gradient="from-blue-500/20 to-blue-900/10"
              />
              <CardsMetricCard
                label="Distance"
                value={ctrl.distanceKm.toFixed(2)}
                unit="km"
                icon={
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                }
                gradient="from-green-500/20 to-green-900/10"
              />
            </div>

            {/* Elapsed time */}
            <div className="flex items-center justify-center rounded-2xl border border-gray-700 bg-gray-800 py-4">
              <span className="font-mono text-4xl font-bold text-white">
                {formatElapsed(ctrl.session.elapsedSeconds)}
              </span>
            </div>

            {/* Rolling chart */}
            {ctrl.chartData.length > 0 && (
              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-3">
                <div className="h-48">
                  <PowerHrChart
                    dataPoints={ctrl.chartData}
                    ftp={ctrl.riderSettings.ftp}
                  />
                </div>
              </div>
            )}

            {/* ERG mode */}
            {ctrl.ergMode.supportsControl && (
              <CardsErgCard
                ergEnabled={ctrl.ergMode.ergEnabled}
                setErgEnabled={ctrl.ergMode.setErgEnabled}
                targetPower={ctrl.ergMode.targetPower}
                setTargetPower={ctrl.ergMode.setTargetPower}
                currentPower={ctrl.currentPower}
              />
            )}

            {/* Session controls */}
            <div className="flex gap-3">
              {ctrl.session.state === "running" && (
                <Button
                  className="flex-1 rounded-xl bg-yellow-600 py-4 text-lg font-bold hover:bg-yellow-500"
                  onClick={ctrl.session.pause}
                >
                  Pause
                </Button>
              )}
              <Button
                variant="destructive"
                className="flex-1 rounded-xl py-4 text-lg font-bold"
                onClick={ctrl.handleStop}
              >
                Stop
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pause modal */}
      {phase === "paused" && (
        <CardsPauseModal
          pausedSeconds={pausedSeconds}
          onResume={ctrl.session.resume}
          onStop={ctrl.handleStop}
        />
      )}

      {/* Post-training */}
      {phase === "post" && ctrl.recorder.summary && (
        <CardsPostTraining
          summary={ctrl.recorder.summary}
          chartData={ctrl.chartData}
          dataPoints={ctrl.recorder.getDataPoints()}
          ftp={ctrl.riderSettings.ftp}
          onReset={ctrl.session.reset}
        />
      )}
    </div>
  );
}
