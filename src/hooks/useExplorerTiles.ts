import * as React from "react";

import {
  type ExplorerTilesResult,
  computeExplorerTiles,
} from "~/utils/explorerTiles";
import type { LatLngTuple } from "~/utils/polyline";

export function useExplorerTiles(
  polylines: LatLngTuple[][],
): ExplorerTilesResult | null {
  return React.useMemo(() => {
    if (polylines.length === 0) return null;
    return computeExplorerTiles(polylines);
  }, [polylines]);
}
