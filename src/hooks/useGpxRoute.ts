import { useCallback, useState } from "react";

export interface GpxPoint {
  lat: number;
  lon: number;
  ele: number;
  /** Cumulative distance in meters from the start of the route. */
  cumulativeDistance: number;
}

export interface GpxRoute {
  points: GpxPoint[];
  totalDistanceMeters: number;
  minElevation: number;
  maxElevation: number;
}

/** Haversine distance between two lat/lon pairs (returns meters). */
function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseGpxXml(xml: string): GpxRoute {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  const trkpts = doc.querySelectorAll("trkpt");
  if (trkpts.length === 0) {
    throw new Error("No trackpoints found in GPX file");
  }

  const points: GpxPoint[] = [];
  let cumDist = 0;
  let minEle = Infinity;
  let maxEle = -Infinity;

  trkpts.forEach((pt, i) => {
    const lat = parseFloat(pt.getAttribute("lat") ?? "0");
    const lon = parseFloat(pt.getAttribute("lon") ?? "0");
    const eleEl = pt.querySelector("ele");
    const ele = eleEl ? parseFloat(eleEl.textContent ?? "0") : 0;

    if (i > 0) {
      const prev = points[i - 1];
      cumDist += haversine(prev.lat, prev.lon, lat, lon);
    }

    if (ele < minEle) minEle = ele;
    if (ele > maxEle) maxEle = ele;

    points.push({ lat, lon, ele, cumulativeDistance: cumDist });
  });

  return {
    points,
    totalDistanceMeters: cumDist,
    minElevation: minEle,
    maxElevation: maxEle,
  };
}

export function useGpxRoute() {
  const [route, setRoute] = useState<GpxRoute | null>(null);

  const loadFromFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        try {
          setRoute(parseGpxXml(text));
        } catch (err) {
          console.error("[GPX] Failed to parse:", err);
        }
      }
    };
    reader.readAsText(file);
  }, []);

  const clear = useCallback(() => setRoute(null), []);

  /** Get gradient (%) at a given distance along the route. */
  const getCurrentGradient = useCallback(
    (distanceMeters: number): number | null => {
      if (!route || route.points.length < 2) return null;

      // Find the segment containing the current distance
      for (let i = 1; i < route.points.length; i++) {
        if (route.points[i].cumulativeDistance >= distanceMeters) {
          const prev = route.points[i - 1];
          const curr = route.points[i];
          const segmentDist = curr.cumulativeDistance - prev.cumulativeDistance;
          if (segmentDist < 0.5) return 0;
          return ((curr.ele - prev.ele) / segmentDist) * 100;
        }
      }

      return 0;
    },
    [route],
  );

  return { route, loadFromFile, clear, getCurrentGradient };
}
