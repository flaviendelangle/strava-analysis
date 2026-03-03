import { useCallback, useEffect, useRef, useState } from "react";

import { BrowserCompatibilityBanner } from "~/components/liveTraining/BrowserCompatibilityBanner";
import { DeviceConnector } from "~/components/liveTraining/DeviceConnector";
import { ExportPanel } from "~/components/liveTraining/ExportPanel";
import { LiveDashboard } from "~/components/liveTraining/LiveDashboard";
import { PowerHrChart } from "~/components/liveTraining/PowerHrChart";
import { SessionControls } from "~/components/liveTraining/SessionControls";
import { SessionSummary } from "~/components/liveTraining/SessionSummary";
import { useAntHeartRate } from "~/hooks/useAntHeartRate";
import { useAntTrainer } from "~/hooks/useAntTrainer";
import { useBleHeartRate } from "~/hooks/useBleHeartRate";
import { useBleTrainer } from "~/hooks/useBleTrainer";
import { useErgMode } from "~/hooks/useErgMode";
import { useRiderSettings } from "~/hooks/useRiderSettings";
import { useTrainingRecorder } from "~/hooks/useTrainingRecorder";
import { useTrainingSession } from "~/hooks/useTrainingSession";
import { msToKmh, SpeedSimulator } from "~/sensors/speedFromPower";
import type { SensorSource, SessionDataPoint } from "~/sensors/types";

export default function TrainingPage() {
  const [hrSource, setHrSource] = useState<SensorSource>("ant+");
  const [trainerSource, setTrainerSource] = useState<SensorSource>("ant+");

  // BLE hooks
  const bleHr = useBleHeartRate();
  const bleTrainer = useBleTrainer();

  // ANT+ hooks
  const antHr = useAntHeartRate();
  const antTrainer = useAntTrainer();

  // Pick active sensor based on selected source
  const hr = hrSource === "ble" ? bleHr : antHr;
  const trainer = trainerSource === "ble" ? bleTrainer : antTrainer;

  // ERG mode
  const ergMode = useErgMode();

  // Session management
  const session = useTrainingSession();
  const recorder = useTrainingRecorder();
  const { addDataPoint, getDataPoints } = recorder;
  const [riderSettings] = useRiderSettings();

  // Chart data (copy of data points array for rendering)
  const [chartData, setChartData] = useState<SessionDataPoint[]>([]);
  // Live speed derived from the simulator (updated in the recording interval)
  const [currentSpeedMs, setCurrentSpeedMs] = useState(0);

  // Refs for volatile data so the recording interval callback stays stable
  // (without these, the interval would be torn down and recreated on every
  // sensor update, preventing it from ever firing its 1 000 ms tick)
  const hrDataRef = useRef(hr.data);
  const trainerDataRef = useRef(trainer.data);
  const riderSettingsRef = useRef(riderSettings);
  const elapsedRef = useRef(session.elapsedSeconds);
  const ergEnabledRef = useRef(ergMode.ergEnabled);
  const targetPowerRef = useRef(ergMode.targetPower);
  const sessionRef = useRef(session);

  // Keep refs in sync after each render
  useEffect(() => {
    hrDataRef.current = hr.data;
    trainerDataRef.current = trainer.data;
    riderSettingsRef.current = riderSettings;
    elapsedRef.current = session.elapsedSeconds;
    ergEnabledRef.current = ergMode.ergEnabled;
    targetPowerRef.current = ergMode.targetPower;
    sessionRef.current = session;
  });

  // Speed simulator with inertia
  const speedSimRef = useRef(new SpeedSimulator());

  // Auto-start: detect sustained power while idle
  const autoStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recording interval
  const recordingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRecording = useCallback(() => {
    if (recordingRef.current !== null) {
      clearInterval(recordingRef.current);
      recordingRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    stopRecording();
    recordingRef.current = setInterval(() => {
      const trainerData = trainerDataRef.current;
      const hrData = hrDataRef.current;
      const settings = riderSettingsRef.current;

      const power = trainerData?.power ?? null;
      const heartRate = hrData?.heartRate ?? trainerData?.heartRate ?? null;
      const cadence = trainerData?.cadence ?? null;

      // Simulate speed with inertia (coasts realistically when power drops)
      const speedMs = speedSimRef.current.update(power ?? 0, 1, {
        riderMassKg: settings.weightKg + settings.bikeWeightKg,
        cdA: settings.cdA,
        crr: settings.crr,
      });

      setCurrentSpeedMs(speedMs);

      addDataPoint({
        power,
        targetPower: ergEnabledRef.current ? targetPowerRef.current : null,
        heartRate,
        cadence,
        speed: speedMs,
        elapsed: elapsedRef.current,
      });

      setChartData([...getDataPoints()]);
    }, 1000);
  }, [addDataPoint, getDataPoints, stopRecording]);

  // Start/stop recording when session state changes
  useEffect(() => {
    if (session.state === "running") {
      startRecording();
    } else {
      stopRecording();
    }
    return stopRecording;
  }, [session.state, startRecording, stopRecording]);

  // Sync trainer control capability into ERG mode context
  useEffect(() => {
    ergMode.setSupportsControl(trainer.supportsControl ?? false);
  }, [trainer.supportsControl]); // eslint-disable-line react-hooks/exhaustive-deps -- ergMode methods are stable refs, including them would cause infinite loops

  // Auto-disable ERG when trainer disconnects
  useEffect(() => {
    if (trainer.state !== "connected") {
      ergMode.setErgEnabled(false);
    }
  }, [trainer.state]); // eslint-disable-line react-hooks/exhaustive-deps -- ergMode.setErgEnabled is a stable context setter

  // Send target power to trainer when ERG is enabled and target changes
  useEffect(() => {
    if (!ergMode.ergEnabled || !trainer.supportsControl) return;
    const timer = setTimeout(() => {
      trainer.setTargetPower(ergMode.targetPower).catch((err) => {
        console.error("[ERG] Failed to set target power:", err);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [ergMode.ergEnabled, ergMode.targetPower, trainer.supportsControl]); // eslint-disable-line react-hooks/exhaustive-deps -- trainer.setTargetPower is a stable ref

  // Auto-start when power is detected while idle
  useEffect(() => {
    const power = trainer.data?.power ?? null;
    if (session.state !== "idle" || power == null || power <= 0) {
      if (autoStartTimerRef.current) {
        clearTimeout(autoStartTimerRef.current);
        autoStartTimerRef.current = null;
      }
      return;
    }

    // Power detected while idle — wait 2s to confirm it's not a glitch
    if (!autoStartTimerRef.current) {
      autoStartTimerRef.current = setTimeout(() => {
        autoStartTimerRef.current = null;
        if (sessionRef.current.state === "idle") {
          recorder.clear();
          setChartData([]);
          speedSimRef.current.reset();
          sessionRef.current.start();
        }
      }, 2000);
    }
  }, [trainer.data?.power, session.state, recorder]);

  // Current live values
  const currentPower = trainer.data?.power ?? null;
  const currentHr = hr.data?.heartRate ?? trainer.data?.heartRate ?? null;
  const currentCadence = trainer.data?.cadence ?? null;
  const currentSpeedKmh = currentSpeedMs > 0.1 ? msToKmh(currentSpeedMs) : null;

  const lastPoint = chartData[chartData.length - 1];
  const distanceKm = lastPoint ? lastPoint.distance / 1000 : 0;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <BrowserCompatibilityBanner />

      {/* Device connection bar */}
      <div className="flex flex-wrap items-center gap-3">
        <DeviceConnector
          label="HR Monitor"
          state={hr.state}
          deviceName={hr.deviceName}
          source={hrSource}
          onSourceChange={setHrSource}
          onConnect={hr.connect}
          onDisconnect={hr.disconnect}
        />
        <DeviceConnector
          label="Trainer"
          state={trainer.state}
          deviceName={trainer.deviceName}
          source={trainerSource}
          onSourceChange={setTrainerSource}
          onConnect={trainer.connect}
          onDisconnect={trainer.disconnect}
        />
      </div>

      {/* Live metrics dashboard */}
      <LiveDashboard
        heartRate={currentHr}
        power={currentPower}
        cadence={currentCadence != null ? Math.round(currentCadence) : null}
        speed={currentSpeedKmh}
        elapsedSeconds={session.elapsedSeconds}
        distanceKm={distanceKm}
        ergTargetPower={ergMode.ergEnabled ? ergMode.targetPower : null}
      />

      {/* Session controls */}
      <SessionControls
        state={session.state}
        onPause={session.pause}
        onResume={session.resume}
        onStop={() => {
          session.stop();
          recorder.computeSummary();
          setChartData([...recorder.getDataPoints()]);
        }}
      />

      {/* Rolling chart / post-session summary */}
      {session.state === "stopped" && recorder.summary ? (
        <div className="flex flex-col gap-4">
          <SessionSummary summary={recorder.summary} />
          <PowerHrChart
            dataPoints={chartData}
            ftp={riderSettings.ftp}
            showAll
          />
          <ExportPanel
            dataPoints={recorder.getDataPoints()}
            summary={recorder.summary}
          />
        </div>
      ) : (
        chartData.length > 0 && (
          <PowerHrChart dataPoints={chartData} ftp={riderSettings.ftp} />
        )
      )}
    </div>
  );
}
