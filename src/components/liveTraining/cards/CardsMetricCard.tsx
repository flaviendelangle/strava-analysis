import type { ReactNode } from "react";

interface CardsMetricCardProps {
  label: string;
  value: string | number | null;
  unit: string;
  icon: ReactNode;
  gradient: string;
}

export function CardsMetricCard({
  label,
  value,
  unit,
  icon,
  gradient,
}: CardsMetricCardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-700 bg-gradient-to-br p-4 ${gradient}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="text-gray-400 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        <span className="text-xs uppercase tracking-wider text-gray-400">
          {label}
        </span>
      </div>
      <div className="font-mono text-4xl font-bold text-white">
        {value ?? "--"}
      </div>
      <div className="mt-1 text-sm text-gray-500">{unit}</div>
    </div>
  );
}
