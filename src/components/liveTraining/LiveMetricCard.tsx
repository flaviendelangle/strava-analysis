interface LiveMetricCardProps {
  label: string;
  value: string | number | null;
  unit: string;
  accentColor: string;
  subtitle?: string;
}

export function LiveMetricCard(props: LiveMetricCardProps) {
  const { label, value, unit, accentColor, subtitle } = props;

  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg bg-gray-800 p-4"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <span className="mb-1 text-xs uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <span className="font-mono text-5xl font-bold text-white">
        {value ?? "--"}
      </span>
      <span className="mt-1 text-sm text-gray-400">{unit}</span>
      {subtitle && (
        <span className="mt-0.5 text-xs text-yellow-400">{subtitle}</span>
      )}
    </div>
  );
}
