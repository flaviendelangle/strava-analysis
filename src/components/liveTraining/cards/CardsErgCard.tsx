import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";

interface CardsErgCardProps {
  ergEnabled: boolean;
  setErgEnabled: (enabled: boolean) => void;
  targetPower: number;
  setTargetPower: (watts: number) => void;
  currentPower: number | null;
}

export function CardsErgCard({
  ergEnabled,
  setErgEnabled,
  targetPower,
  setTargetPower,
  currentPower,
}: CardsErgCardProps) {
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-yellow-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7 2v11h3v9l7-12h-4l4-8z" />
          </svg>
          <span className="text-sm font-medium text-gray-300">ERG Mode</span>
        </div>
        <Switch checked={ergEnabled} onCheckedChange={setErgEnabled} />
      </div>
      {ergEnabled && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setTargetPower(targetPower - 10)}
            >
              -10
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setTargetPower(targetPower - 5)}
            >
              -5
            </Button>
            <span className="w-24 text-center font-mono text-3xl font-bold text-yellow-400">
              {targetPower}W
            </span>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setTargetPower(targetPower + 5)}
            >
              +5
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setTargetPower(targetPower + 10)}
            >
              +10
            </Button>
          </div>
          {currentPower != null && (
            <div className="relative h-4 overflow-hidden rounded-full bg-gray-700">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (currentPower / targetPower) * 100)}%`,
                  backgroundColor:
                    Math.abs(currentPower - targetPower) < 10
                      ? "#22C55E"
                      : "#EF4444",
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
