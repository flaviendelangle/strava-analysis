import * as React from "react";

import type { Doc } from "../../convex/_generated/dataModel";
import {
  computeExplorerTiles,
  createTileCoordSystem,
  type ExplorerTilesResult,
} from "~/utils/explorerTiles";
import { decode, type LatLngTuple } from "~/utils/polyline";

export function useExplorerTiles(
  activities: Doc<"activities">[] | null,
): ExplorerTilesResult | null {
  // Stage 1: decode polylines
  const polylines = React.useMemo<LatLngTuple[][]>(() => {
    if (!activities) return [];
    const result: LatLngTuple[][] = [];
    for (const activity of activities) {
      if (activity.mapPolyline) {
        result.push(decode(activity.mapPolyline));
      }
    }
    return result;
  }, [activities]);

  // Stage 2: compute reference latitude and tile coordinate system
  const system = React.useMemo(() => {
    if (polylines.length === 0) return null;

    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const polyline of polylines) {
      for (const [lat] of polyline) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }

    return createTileCoordSystem((minLat + maxLat) / 2);
  }, [polylines]);

  // Stage 3: full classification pipeline
  return React.useMemo(() => {
    if (!system || polylines.length === 0) return null;
    return computeExplorerTiles(polylines, system);
  }, [polylines, system]);
}
