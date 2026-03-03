import { formatElapsed } from "~/utils/format";

interface HudTopBarProps {
  elapsedSeconds: number;
  distanceKm: number;
  speedKmh: number | null;
}

export function HudTopBar({
  elapsedSeconds,
  distanceKm,
  speedKmh,
}: HudTopBarProps) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-gray-700/30 bg-gray-900/60 px-6 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-gray-500">
          Dist
        </span>
        <span className="font-mono text-lg text-white">
          {distanceKm.toFixed(2)}
        </span>
        <span className="text-xs text-gray-500">km</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-3xl font-bold text-white">
          {formatElapsed(elapsedSeconds)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-gray-500">
          Speed
        </span>
        <span className="font-mono text-lg text-white">
          {speedKmh != null ? speedKmh.toFixed(1) : "--"}
        </span>
        <span className="text-xs text-gray-500">km/h</span>
      </div>
    </div>
  );
}
