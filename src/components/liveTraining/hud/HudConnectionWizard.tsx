import { Button } from "~/components/ui/button";
import type { ConnectionState, SensorSource } from "~/sensors/types";

interface HudDeviceCardProps {
  type: "heartRate" | "trainer";
  state: ConnectionState;
  deviceName: string | null;
  source: SensorSource;
  onSourceChange: (s: SensorSource) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

function HudDeviceCard({
  type,
  state,
  deviceName,
  source,
  onSourceChange,
  onConnect,
  onDisconnect,
}: HudDeviceCardProps) {
  const isConnected = state === "connected";
  const isConnecting = state === "connecting";
  const label = type === "heartRate" ? "Heart Rate" : "Trainer";

  return (
    <div
      className={`relative w-80 overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-700 ${
        isConnected
          ? "border-green-500/40 bg-green-950/30"
          : "border-gray-600/50 bg-gray-800/60"
      }`}
    >
      <div className="flex flex-col items-center gap-4 p-8">
        {/* Sensor icon with animation */}
        <div className="relative">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full transition-colors duration-500 ${
              isConnected ? "bg-green-500/20" : "bg-gray-700/60"
            }`}
          >
            {type === "heartRate" ? (
              <svg
                className={`h-10 w-10 transition-colors duration-500 ${isConnected ? "text-green-400" : "text-red-400"}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg
                className={`h-10 w-10 transition-colors duration-500 ${isConnected ? "text-green-400" : "text-purple-400"}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2M5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5m5.8-10 2.4-2.4.8.8c1.3 1.3 3 2.1 5 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5" />
              </svg>
            )}
          </div>

          {/* Connecting ripple rings */}
          {isConnecting && (
            <>
              <span className="absolute inset-0 animate-ripple rounded-full border-2 border-purple-400/40" />
              <span
                className="absolute inset-0 animate-ripple rounded-full border-2 border-purple-400/20"
                style={{ animationDelay: "0.75s" }}
              />
            </>
          )}

          {/* Connected checkmark overlay */}
          {isConnected && (
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Label + status */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">{label}</h3>
          <p className="mt-1 text-sm text-gray-400">
            {isConnected
              ? deviceName ?? "Connected"
              : isConnecting
                ? "Searching..."
                : "Not connected"}
          </p>
        </div>

        {/* BLE/ANT+ toggle */}
        <div className="flex gap-1 rounded-lg bg-gray-900/70 p-1">
          <button
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              source === "ble"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => onSourceChange("ble")}
            disabled={state !== "disconnected"}
          >
            BLE
          </button>
          <button
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              source === "ant+"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => onSourceChange("ant+")}
            disabled={state !== "disconnected"}
          >
            ANT+
          </button>
        </div>

        {/* Connect button */}
        <Button
          onClick={isConnected ? onDisconnect : onConnect}
          disabled={isConnecting}
          className={`w-full ${
            isConnected
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-purple-600 hover:bg-purple-500"
          }`}
        >
          {isConnected ? "Disconnect" : isConnecting ? "Searching..." : "Connect"}
        </Button>
      </div>
    </div>
  );
}

interface HudConnectionWizardProps {
  hrState: ConnectionState;
  hrDeviceName: string | null;
  hrSource: SensorSource;
  onHrSourceChange: (s: SensorSource) => void;
  onHrConnect: () => void;
  onHrDisconnect: () => void;
  trainerState: ConnectionState;
  trainerDeviceName: string | null;
  trainerSource: SensorSource;
  onTrainerSourceChange: (s: SensorSource) => void;
  onTrainerConnect: () => void;
  onTrainerDisconnect: () => void;
}

export function HudConnectionWizard(props: HudConnectionWizardProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-3xl font-bold text-white">Connect Devices</h1>
        <p className="text-gray-400">
          Pair your sensors to get started
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <HudDeviceCard
            type="heartRate"
            state={props.hrState}
            deviceName={props.hrDeviceName}
            source={props.hrSource}
            onSourceChange={props.onHrSourceChange}
            onConnect={props.onHrConnect}
            onDisconnect={props.onHrDisconnect}
          />
          <HudDeviceCard
            type="trainer"
            state={props.trainerState}
            deviceName={props.trainerDeviceName}
            source={props.trainerSource}
            onSourceChange={props.onTrainerSourceChange}
            onConnect={props.onTrainerConnect}
            onDisconnect={props.onTrainerDisconnect}
          />
        </div>
      </div>
    </div>
  );
}
