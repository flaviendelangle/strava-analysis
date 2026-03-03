import { Button } from "~/components/ui/button";
import { formatElapsed } from "~/utils/format";

interface CardsPauseModalProps {
  pausedSeconds: number;
  onResume: () => void;
  onStop: () => void;
}

export function CardsPauseModal({
  pausedSeconds,
  onResume,
  onStop,
}: CardsPauseModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
      <div className="mx-4 max-w-sm rounded-3xl border border-gray-700 bg-gray-800 p-8 text-center">
        <p className="mb-2 text-3xl font-bold text-white">Paused</p>
        <p className="mb-6 text-sm text-gray-400">
          Paused for {formatElapsed(pausedSeconds)}
        </p>
        <div className="flex gap-3">
          <Button
            className="flex-1 rounded-xl bg-green-600 py-3 hover:bg-green-500"
            onClick={onResume}
          >
            Resume
          </Button>
          <Button
            variant="destructive"
            className="flex-1 rounded-xl py-3"
            onClick={onStop}
          >
            Stop
          </Button>
        </div>
      </div>
    </div>
  );
}
