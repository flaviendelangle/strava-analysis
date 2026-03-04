import * as React from "react";

import type { Activity } from "@server/db/types";

import {
  type ExplorerTilesResult,
  computeExplorerTiles,
} from "~/utils/explorerTiles";
import { type LatLngTuple, decode } from "~/utils/polyline";

export function useExplorerTiles(
  activities: Activity[] | null,
): ExplorerTilesResult | null {
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

  return React.useMemo(() => {
    if (polylines.length === 0) return null;
    return computeExplorerTiles(polylines);
  }, [polylines]);
}
