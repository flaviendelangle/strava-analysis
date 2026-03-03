import type { ConnectionState, SensorSource } from "~/sensors/types";

interface CockpitDeviceTileProps {
  type: "heartRate" | "trainer";
  state: ConnectionState;
  deviceName: string | null;
  source: SensorSource;
  onSourceChange: (s: SensorSource) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

function StatusDot({ state }: { state: ConnectionState }) {
  const color =
    state === "connected"
      ? "bg-green-500"
      : state === "connecting"
        ? "bg-yellow-500 animate-pulse"
        : state === "error"
          ? "bg-red-500"
          : "bg-gray-500";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

function CockpitDeviceTile({
  type,
  state,
  deviceName,
  source,
  onSourceChange,
  onConnect,
  onDisconnect,
}: CockpitDeviceTileProps) {
  const isConnected = state === "connected";
  const isConnecting = state === "connecting";

  return (
    <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 transition-colors hover:border-gray-600">
      <StatusDot state={state} />
      <svg
        className="h-4 w-4 text-gray-400"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        {type === "heartRate" ? (
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        ) : (
          <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2M5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5m5.8-10 2.4-2.4.8.8c1.3 1.3 3 2.1 5 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5" />
        )}
      </svg>
      <span className="text-xs text-gray-300">
        {isConnected
          ? deviceName ?? (type === "heartRate" ? "HR" : "Trainer")
          : isConnecting
            ? "Searching..."
            : type === "heartRate"
              ? "HR Monitor"
              : "Trainer"}
      </span>
      {!isConnected && (
        <select
          className="h-6 rounded bg-gray-900 px-1 text-xs text-gray-400"
          value={source}
          onChange={(e) => onSourceChange(e.target.value as SensorSource)}
          disabled={isConnecting}
        >
          <option value="ble">BLE</option>
          <option value="ant+">ANT+</option>
        </select>
      )}
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isConnecting}
        className={`rounded px-2 py-0.5 text-xs font-medium ${
          isConnected
            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
            : "bg-purple-600 text-white hover:bg-purple-500"
        } disabled:opacity-50`}
      >
        {isConnected ? "Disconnect" : isConnecting ? "..." : "Connect"}
      </button>
    </div>
  );
}

interface CockpitConnectionBarProps {
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
  bothConnected: boolean;
}

export function CockpitConnectionBar(props: CockpitConnectionBarProps) {
  // Once both connected, show compact strip
  if (props.bothConnected) {
    return (
      <div className="flex items-center gap-4 border-b border-gray-700/50 bg-gray-900 px-4 py-1">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {props.hrDeviceName ?? "HR"}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {props.trainerDeviceName ?? "Trainer"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-b border-gray-700 bg-gray-850 px-4 py-2">
      <CockpitDeviceTile
        type="heartRate"
        state={props.hrState}
        deviceName={props.hrDeviceName}
        source={props.hrSource}
        onSourceChange={props.onHrSourceChange}
        onConnect={props.onHrConnect}
        onDisconnect={props.onHrDisconnect}
      />
      <CockpitDeviceTile
        type="trainer"
        state={props.trainerState}
        deviceName={props.trainerDeviceName}
        source={props.trainerSource}
        onSourceChange={props.onTrainerSourceChange}
        onConnect={props.onTrainerConnect}
        onDisconnect={props.onTrainerDisconnect}
      />
    </div>
  );
}
