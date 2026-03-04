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
    <div className="border-border/50 bg-card/70 w-36 rounded-xl border p-3 backdrop-blur-sm">
      <div className="text-muted-foreground text-xs tracking-wider uppercase">
        {label}
      </div>
      <div className="font-mono text-3xl font-bold" style={{ color }}>
        {value ?? "--"}
      </div>
      <div className="text-muted-foreground text-xs">{unit}</div>
    </div>
  );
}
