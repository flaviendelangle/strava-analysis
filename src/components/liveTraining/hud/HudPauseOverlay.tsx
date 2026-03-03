import { Button } from "~/components/ui/button";
import { formatElapsed } from "~/utils/format";

interface HudPauseOverlayProps {
  pausedSeconds: number;
  onResume: () => void;
  onStop: () => void;
}

export function HudPauseOverlay({
  pausedSeconds,
  onResume,
  onStop,
}: HudPauseOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6">
        <span className="text-6xl font-black tracking-widest text-white/80">
          PAUSED
        </span>
        <span className="font-mono text-2xl text-gray-400">
          {formatElapsed(pausedSeconds)}
        </span>
        <div className="mt-4 flex gap-4">
          <Button
            onClick={onResume}
            className="bg-green-600 px-8 py-3 text-lg font-bold hover:bg-green-500"
          >
            Resume
          </Button>
          <Button
            variant="destructive"
            onClick={onStop}
            className="px-8 py-3 text-lg font-bold"
          >
            Stop
          </Button>
        </div>
      </div>
    </div>
  );
}
