import { Button } from "~/components/ui/button";
import type { ConnectionState, SensorSource } from "~/sensors/types";

interface CardsDeviceCardProps {
  type: "heartRate" | "trainer";
  state: ConnectionState;
  deviceName: string | null;
  source: SensorSource;
  onSourceChange: (s: SensorSource) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

function CardsDeviceCard({
  type,
  state,
  deviceName,
  source,
  onSourceChange,
  onConnect,
  onDisconnect,
}: CardsDeviceCardProps) {
  const isConnected = state === "connected";
  const isConnecting = state === "connecting";

  return (
    <div
      className={`w-full rounded-2xl border p-6 transition-all duration-500 ${
        isConnected
          ? "border-green-500/30 bg-green-950/20"
          : "border-gray-700 bg-gray-800"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${
              isConnected ? "bg-green-500/20" : "bg-gray-700"
            }`}
          >
            {type === "heartRate" ? (
              <svg
                className={`h-7 w-7 ${isConnected ? "text-green-400" : "text-red-400"}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg
                className={`h-7 w-7 ${isConnected ? "text-green-400" : "text-purple-400"}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2M5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5m5.8-10 2.4-2.4.8.8c1.3 1.3 3 2.1 5 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5" />
              </svg>
            )}
          </div>
          {isConnecting && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-purple-400/30" />
              <span
                className="absolute inset-0 animate-ping rounded-full bg-purple-400/20"
                style={{ animationDelay: "0.5s" }}
              />
            </>
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-white">
            {type === "heartRate" ? "Heart Rate Monitor" : "Smart Trainer"}
          </h3>
          <p className="text-sm text-gray-400">
            {isConnected
              ? deviceName ?? "Connected"
              : isConnecting
                ? "Searching..."
                : "Not connected"}
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-gray-900 p-1">
          <button
            className={`rounded-md px-2 py-1 text-xs ${
              source === "ble"
                ? "bg-purple-600 text-white"
                : "text-gray-400"
            }`}
            onClick={() => onSourceChange("ble")}
            disabled={state !== "disconnected"}
          >
            BLE
          </button>
          <button
            className={`rounded-md px-2 py-1 text-xs ${
              source === "ant+"
                ? "bg-purple-600 text-white"
                : "text-gray-400"
            }`}
            onClick={() => onSourceChange("ant+")}
            disabled={state !== "disconnected"}
          >
            ANT+
          </button>
        </div>

        <Button
          onClick={isConnected ? onDisconnect : onConnect}
          disabled={isConnecting}
          className={
            isConnected
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-purple-600 hover:bg-purple-500"
          }
        >
          {isConnected
            ? "Disconnect"
            : isConnecting
              ? "..."
              : "Connect"}
        </Button>
      </div>
    </div>
  );
}

interface CardsConnectionSetupProps {
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

export function CardsConnectionSetup(props: CardsConnectionSetupProps) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          Connect Your Devices
        </h1>
        <CardsDeviceCard
          type="heartRate"
          state={props.hrState}
          deviceName={props.hrDeviceName}
          source={props.hrSource}
          onSourceChange={props.onHrSourceChange}
          onConnect={props.onHrConnect}
          onDisconnect={props.onHrDisconnect}
        />
        <CardsDeviceCard
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
  );
}
