interface CockpitMetricPanelProps {
  label: string;
  value: string | number | null;
  unit: string;
  size?: "small" | "medium" | "large";
  accentColor?: string;
  bgColor?: string;
  subtitle?: string;
  isPaused?: boolean;
}

export function CockpitMetricPanel({
  label,
  value,
  unit,
  size = "small",
  accentColor = "#9CA3AF",
  bgColor,
  subtitle,
  isPaused,
}: CockpitMetricPanelProps) {
  const valueSize =
    size === "large"
      ? "text-6xl"
      : size === "medium"
        ? "text-4xl"
        : "text-3xl";

  return (
    <div
      className="relative rounded-lg border border-gray-700 bg-gray-800 p-3"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
        backgroundColor: bgColor ? bgColor + "20" : undefined,
      }}
    >
      <div className="text-xs uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className={`font-mono ${valueSize} font-bold text-white`}>
        {value ?? "--"}
        {unit && (
          <span className="ml-1 text-sm font-normal text-gray-500">
            {unit}
          </span>
        )}
      </div>
      {subtitle && (
        <div className="text-xs font-semibold" style={{ color: accentColor }}>
          {subtitle}
        </div>
      )}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-900/60">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">
            Paused
          </span>
        </div>
      )}
    </div>
  );
}
