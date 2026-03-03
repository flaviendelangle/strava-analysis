import { getPowerZoneColor, getPowerZoneName } from "~/sensors/types";

interface CardsPowerHeroProps {
  power: number | null;
  ftp: number;
  weightKg: number;
}

export function CardsPowerHero({ power, ftp, weightKg }: CardsPowerHeroProps) {
  const zoneColor = getPowerZoneColor(power ?? 0, ftp);
  const zoneName = getPowerZoneName(power ?? 0, ftp);
  const wattsPerKg = power != null ? (power / weightKg).toFixed(1) : null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-gray-700 p-6"
      style={{
        background: power != null
          ? `linear-gradient(135deg, ${zoneColor}30 0%, ${zoneColor}10 50%, rgb(31,41,55) 100%)`
          : "rgb(31,41,55)",
        transition: "background 0.5s ease-out",
      }}
    >
      {power != null && (
        <div
          className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold uppercase"
          style={{
            backgroundColor: zoneColor + "40",
            color: zoneColor,
          }}
        >
          {zoneName}
        </div>
      )}

      <div className="mb-1 text-xs uppercase tracking-wider text-gray-400">
        Power
      </div>
      <div className="font-mono text-7xl font-black text-white">
        {power ?? "--"}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-lg text-gray-400">W</span>
        {wattsPerKg && (
          <span className="text-sm text-gray-500">{wattsPerKg} W/kg</span>
        )}
      </div>
    </div>
  );
}
