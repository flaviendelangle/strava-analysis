import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import type { SessionState } from "~/hooks/useTrainingSession";

interface CockpitBottomBarProps {
  sessionState: SessionState;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  supportsControl: boolean;
  ergEnabled: boolean;
  setErgEnabled: (enabled: boolean) => void;
  targetPower: number;
  setTargetPower: (watts: number) => void;
}

export function CockpitBottomBar({
  sessionState,
  onPause,
  onResume,
  onStop,
  supportsControl,
  ergEnabled,
  setErgEnabled,
  targetPower,
  setTargetPower,
}: CockpitBottomBarProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-4 border-t border-gray-700 bg-gray-900 px-4">
      {/* ERG controls (left side) */}
      {supportsControl && (
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase text-gray-500">ERG</label>
          <Switch checked={ergEnabled} onCheckedChange={setErgEnabled} />
          {ergEnabled && (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTargetPower(targetPower - 5)}
              >
                -5
              </Button>
              <span className="w-16 text-center font-mono text-sm font-bold text-yellow-400">
                {targetPower}W
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTargetPower(targetPower + 5)}
              >
                +5
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Session controls (right side) */}
      {sessionState === "running" && (
        <Button
          className="bg-yellow-600 px-6 hover:bg-yellow-500"
          onClick={onPause}
        >
          Pause
        </Button>
      )}
      {sessionState === "paused" && (
        <Button
          className="bg-green-600 px-6 hover:bg-green-500"
          onClick={onResume}
        >
          Resume
        </Button>
      )}
      {(sessionState === "running" || sessionState === "paused") && (
        <Button variant="destructive" className="px-6" onClick={onStop}>
          Stop
        </Button>
      )}
    </div>
  );
}
