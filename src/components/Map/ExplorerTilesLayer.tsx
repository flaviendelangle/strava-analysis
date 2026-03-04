import * as React from "react";

import * as L from "leaflet";
import { useMap } from "react-leaflet";

import {
  type ClassifiedTile,
  type TileCategory,
  pointToTile,
  tileToBounds,
} from "~/utils/explorerTiles";
import type { ExplorerTilesResult } from "~/utils/explorerTiles";

const TILE_COLORS: Record<TileCategory, { fill: string; stroke: string }> = {
  maxSquare: { fill: "#7c3aed", stroke: "#6d28d9" },
  cluster: { fill: "#3b82f6", stroke: "#2563eb" },
  clusterBorder: { fill: "#93c5fd", stroke: "#60a5fa" },
  isolated: { fill: "#f87171", stroke: "#ef4444" },
};

/** Get the tile coordinate range visible in the current map viewport. */
function getVisibleTileRange(map: L.Map) {
  const bounds = map.getBounds();
  const nw = pointToTile(bounds.getNorth(), bounds.getWest());
  const se = pointToTile(bounds.getSouth(), bounds.getEast());
  return {
    minTx: Math.min(nw.tx, se.tx) - 1,
    maxTx: Math.max(nw.tx, se.tx) + 1,
    minTy: Math.min(nw.ty, se.ty) - 1,
    maxTy: Math.max(nw.ty, se.ty) + 1,
  };
}

function isTileVisible(
  tile: ClassifiedTile,
  range: ReturnType<typeof getVisibleTileRange>,
) {
  return (
    tile.tx >= range.minTx &&
    tile.tx <= range.maxTx &&
    tile.ty >= range.minTy &&
    tile.ty <= range.maxTy
  );
}

interface ExplorerTilesLayerProps {
  tilesData: ExplorerTilesResult | null;
  visible: boolean;
}

export function ExplorerTilesLayer({
  tilesData,
  visible,
}: ExplorerTilesLayerProps) {
  const map = useMap();

  const layerRef = React.useRef<L.FeatureGroup | null>(null);
  const rendererRef = React.useRef<L.Canvas | null>(null);
  const tilesDataRef = React.useRef(tilesData);
  React.useEffect(() => {
    tilesDataRef.current = tilesData;
  });

  // Create pane, renderer, and layer group once
  React.useEffect(() => {
    if (!map.getPane("explorerTilesPane")) {
      const pane = map.createPane("explorerTilesPane");
      pane.style.zIndex = "250";
    }
    rendererRef.current = L.canvas({ pane: "explorerTilesPane" });
    layerRef.current = L.featureGroup();

    return () => {
      layerRef.current?.remove();
      layerRef.current = null;
      rendererRef.current = null;
    };
  }, [map]);

  const renderVisibleTiles = React.useCallback(() => {
    const layer = layerRef.current;
    const renderer = rendererRef.current;
    const data = tilesDataRef.current;
    if (!layer || !renderer || !data) {
      layer?.clearLayers();
      return;
    }

    layer.clearLayers();
    const range = getVisibleTileRange(map);

    for (const tile of data.tiles) {
      if (!isTileVisible(tile, range)) continue;

      const bounds = tileToBounds(tile.tx, tile.ty);
      const colors = TILE_COLORS[tile.category];

      L.rectangle(
        [
          [bounds.south, bounds.west],
          [bounds.north, bounds.east],
        ],
        {
          renderer,
          pane: "explorerTilesPane",
          color: colors.stroke,
          fillColor: colors.fill,
          fillOpacity: 0.35,
          weight: 0.5,
          interactive: false,
        },
      ).addTo(layer);
    }
  }, [map]);

  // Re-render tiles when data changes
  React.useEffect(() => {
    renderVisibleTiles();
  }, [tilesData, renderVisibleTiles]);

  // Re-render on viewport changes
  React.useEffect(() => {
    map.on("moveend", renderVisibleTiles);
    return () => {
      map.off("moveend", renderVisibleTiles);
    };
  }, [map, renderVisibleTiles]);

  // Show/hide based on visible prop
  React.useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    if (visible) {
      layer.addTo(map);
    } else {
      layer.remove();
    }
  }, [visible, map]);

  return null;
}
