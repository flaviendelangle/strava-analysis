import type { ConnectionState, SensorSource } from "~/sensors/types";

interface DeviceConnectorProps {
  label: string;
  state: ConnectionState;
  deviceName: string | null;
  source: SensorSource;
  onSourceChange: (source: SensorSource) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

function StatusDot({ state }: { state: ConnectionState }) {
  const colors: Record<ConnectionState, string> = {
    disconnected: "bg-gray-500",
    connecting: "bg-yellow-400 animate-pulse",
    connected: "bg-green-500",
    error: "bg-red-500",
  };

  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[state]}`} />;
}

export function DeviceConnector(props: DeviceConnectorProps) {
  const {
    label,
    state,
    deviceName,
    source,
    onSourceChange,
    onConnect,
    onDisconnect,
  } = props;

  const isConnected = state === "connected";
  const isConnecting = state === "connecting";

  return (
    <div className="flex items-center gap-3 rounded-md bg-gray-800 px-3 py-2">
      <StatusDot state={state} />

      <div className="flex items-center gap-2">
        <select
          value={source}
          onChange={(e) => onSourceChange(e.target.value as SensorSource)}
          disabled={isConnected || isConnecting}
          className="rounded border border-gray-600 bg-gray-700 px-1.5 py-0.5 text-xs text-gray-300 disabled:opacity-50"
        >
          <option value="ble">BLE</option>
          <option value="ant+">ANT+</option>
        </select>
      </div>

      <button
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isConnecting}
        className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
      >
        {isConnecting
          ? "Connecting..."
          : isConnected
            ? deviceName ?? label
            : `Connect ${label}`}
      </button>

      {state === "error" && (
        <span className="text-xs text-red-400">Connection failed</span>
      )}
    </div>
  );
}
