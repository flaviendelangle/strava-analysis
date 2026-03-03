interface HudMetricTileProps {
  label: string;
  value: string | number | null;
  unit: string;
  color: string;
}

export function HudMetricTile({
  label,
  value,
  unit,
  color,
}: HudMetricTileProps) {
  return (
    <div className="w-36 rounded-xl border border-gray-700/50 bg-gray-800/70 p-3 backdrop-blur-sm">
      <div className="text-xs uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className="font-mono text-3xl font-bold" style={{ color }}>
        {value ?? "--"}
      </div>
      <div className="text-xs text-gray-500">{unit}</div>
    </div>
  );
}
