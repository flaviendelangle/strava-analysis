interface HudWaitingScreenProps {
  currentHr: number | null;
  hrConnected: boolean;
  onManualStart: () => void;
}

export function HudWaitingScreen({
  currentHr,
  hrConnected,
  onManualStart,
}: HudWaitingScreenProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
      {/* Live HR badge */}
      {hrConnected && currentHr != null && (
        <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-gray-700/50 bg-gray-800/70 px-4 py-2 backdrop-blur-sm">
          <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="font-mono text-sm text-red-400">{currentHr}</span>
          <span className="text-xs text-gray-500">bpm</span>
        </div>
      )}

      {/* Center content */}
      <div className="flex flex-col items-center gap-6">
        {/* Pedal icon */}
        <div className="relative">
          <svg
            className="h-20 w-20 text-gray-600"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2M5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5m5.8-10 2.4-2.4.8.8c1.3 1.3 3 2.1 5 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5" />
          </svg>
        </div>

        <p className="animate-breathe text-2xl font-light tracking-wide text-gray-400">
          Start pedaling to begin
        </p>

        <button
          onClick={onManualStart}
          className="mt-4 rounded-full border border-gray-600 px-6 py-2 text-sm text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
        >
          Start Manually
        </button>
      </div>
    </div>
  );
}
