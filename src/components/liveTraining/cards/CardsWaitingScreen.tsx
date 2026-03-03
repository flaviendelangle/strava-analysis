import { Button } from "~/components/ui/button";

interface CardsWaitingScreenProps {
  currentHr: number | null;
  hrConnected: boolean;
  onManualStart: () => void;
}

export function CardsWaitingScreen({
  currentHr,
  hrConnected,
  onManualStart,
}: CardsWaitingScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      {hrConnected && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-sm">
          <svg
            className="h-3.5 w-3.5 text-red-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="font-mono text-red-400">{currentHr ?? "--"}</span>
          <span className="text-xs text-red-400/60">bpm</span>
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <svg
          className="h-8 w-8 animate-pulse text-red-400"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <svg
          className="h-8 w-8 animate-pulse text-yellow-400"
          style={{ animationDelay: "0.5s" }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7 2v11h3v9l7-12h-4l4-8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white">Ready to Ride</h2>
      <p className="mt-2 text-gray-400">
        Start pedaling to begin your session
      </p>

      <Button variant="outline" className="mt-6" onClick={onManualStart}>
        Or start manually
      </Button>
    </div>
  );
}
