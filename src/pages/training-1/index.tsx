import { useEffect, useRef, useState } from "react";

import { BrowserCompatibilityBanner } from "~/components/liveTraining/BrowserCompatibilityBanner";
import { HudConnectionWizard } from "~/components/liveTraining/hud/HudConnectionWizard";
import { HudMainView } from "~/components/liveTraining/hud/HudMainView";
import { HudPauseOverlay } from "~/components/liveTraining/hud/HudPauseOverlay";
import { HudPostTraining } from "~/components/liveTraining/hud/HudPostTraining";
import { HudWaitingScreen } from "~/components/liveTraining/hud/HudWaitingScreen";
import { useTrainingPageController } from "~/hooks/useTrainingPageController";

type Phase = "connection" | "waiting" | "main" | "paused" | "post";

function getPhase(ctrl: ReturnType<typeof useTrainingPageController>): Phase {
  if (ctrl.session.state === "stopped") return "post";
  if (ctrl.session.state === "paused") return "paused";
  if (ctrl.session.state === "running") return "main";
  if (ctrl.hr.state === "connected" && ctrl.trainer.state === "connected")
    return "waiting";
  return "connection";
}

export default function Training1Page() {
  const ctrl = useTrainingPageController();
  const phase = getPhase(ctrl);


  // Track paused duration
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
    <div className="relative h-full overflow-hidden">
      <div className="absolute top-0 right-0 left-0 z-[60] p-2">
        <BrowserCompatibilityBanner />
      </div>

      {/* Main training view (always mounted when running/paused so it freezes behind overlays) */}
      {(phase === "main" || phase === "paused") && (
        <HudMainView
          currentPower={ctrl.currentPower}
          currentHr={ctrl.currentHr}
          currentCadence={ctrl.currentCadence}
          currentSpeedKmh={ctrl.currentSpeedKmh}
          distanceKm={ctrl.distanceKm}
          elapsedSeconds={ctrl.session.elapsedSeconds}
          chartData={ctrl.chartData}
          ftp={ctrl.riderSettings.ftp}
          weightKg={ctrl.riderSettings.weightKg}
          onPause={ctrl.session.pause}
          onStop={ctrl.handleStop}
        />
      )}

      {/* Connection wizard */}
      {phase === "connection" && (
        <HudConnectionWizard
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
        <HudWaitingScreen
          currentHr={ctrl.currentHr}
          hrConnected={ctrl.hr.state === "connected"}
          onManualStart={() => {
            ctrl.recorder.clear();
            ctrl.session.start();
          }}
          ergEnabled={ctrl.ergMode.ergEnabled}
          onErgEnabledChange={ctrl.ergMode.setErgEnabled}
          targetPower={ctrl.ergMode.targetPower}
          onTargetPowerChange={ctrl.ergMode.setTargetPower}
          supportsControl={ctrl.ergMode.supportsControl}
        />
      )}

      {/* Pause overlay */}
      {phase === "paused" && (
        <HudPauseOverlay
          pausedSeconds={pausedSeconds}
          onResume={ctrl.session.resume}
          onStop={ctrl.handleStop}
        />
      )}

      {/* Post-training slide-up */}
      {phase === "post" && ctrl.recorder.summary && (
        <HudPostTraining
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
