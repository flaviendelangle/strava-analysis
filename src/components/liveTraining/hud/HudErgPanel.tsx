import { Switch } from "~/components/ui/switch";

interface HudErgPanelProps {
  ergEnabled: boolean;
  setErgEnabled: (v: boolean) => void;
  targetPower: number;
  setTargetPower: (v: number) => void;
}

export function HudErgPanel({
  ergEnabled,
  setErgEnabled,
  targetPower,
  setTargetPower,
}: HudErgPanelProps) {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
          ERG
        </span>
        <Switch checked={ergEnabled} onCheckedChange={setErgEnabled} />

        {ergEnabled && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTargetPower(Math.max(0, targetPower - 5))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-700 text-sm text-white hover:bg-gray-600"
            >
              -5
            </button>
            <span className="min-w-[4rem] text-center font-mono text-2xl font-bold text-yellow-400">
              {targetPower}
            </span>
            <button
              onClick={() => setTargetPower(targetPower + 5)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-700 text-sm text-white hover:bg-gray-600"
            >
              +5
            </button>
            <span className="text-xs text-gray-500">W</span>
          </div>
        )}
      </div>
    </div>
  );
}
