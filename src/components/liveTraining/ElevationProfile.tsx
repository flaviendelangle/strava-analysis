import type { GpxRoute } from "~/hooks/useGpxRoute";

interface ElevationProfileProps {
  route: GpxRoute;
  currentDistanceMeters: number;
  height?: number;
  className?: string;
}

export function ElevationProfile({
  route,
  currentDistanceMeters,
  height = 64,
  className,
}: ElevationProfileProps) {
  const { points, totalDistanceMeters, minElevation, maxElevation } = route;

  if (points.length < 2 || totalDistanceMeters < 1) return null;

  const W = 1000;
  const H = height;
  const padding = 2;
  const elevRange = maxElevation - minElevation || 1;

  const toX = (dist: number) => (dist / totalDistanceMeters) * W;
  const toY = (ele: number) =>
    H - padding - ((ele - minElevation) / elevRange) * (H - 2 * padding);

  // Build SVG path for the area fill
  const areaPath = points
    .map((p, i) => {
      const x = toX(p.cumulativeDistance);
      const y = toY(p.ele);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const fullArea = `${areaPath} L ${W} ${H} L 0 ${H} Z`;

  // Current position marker
  const markerX = toX(
    Math.min(currentDistanceMeters, totalDistanceMeters),
  );

  // Interpolate current elevation for marker Y
  let markerY = H / 2;
  for (let i = 1; i < points.length; i++) {
    if (points[i].cumulativeDistance >= currentDistanceMeters) {
      const prev = points[i - 1];
      const curr = points[i];
      const segDist = curr.cumulativeDistance - prev.cumulativeDistance;
      const t =
        segDist > 0
          ? (currentDistanceMeters - prev.cumulativeDistance) / segDist
          : 0;
      const ele = prev.ele + t * (curr.ele - prev.ele);
      markerY = toY(ele);
      break;
    }
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height }}
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id="elev-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={fullArea} fill="url(#elev-fill)" />

      {/* Elevation line */}
      <path
        d={areaPath}
        fill="none"
        stroke="#7c3aed"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />

      {/* Current position marker */}
      <line
        x1={markerX}
        y1={0}
        x2={markerX}
        y2={H}
        stroke="#facc15"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={markerX}
        cy={markerY}
        r="4"
        fill="#facc15"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
