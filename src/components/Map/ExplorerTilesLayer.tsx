import * as L from "leaflet";
import * as React from "react";
import { useMap } from "react-leaflet";

import type { Doc } from "../../../convex/_generated/dataModel";
import { useExplorerTiles } from "~/hooks/useExplorerTiles";
import { tileToBounds, type TileCategory } from "~/utils/explorerTiles";


const TILE_COLORS: Record<TileCategory, { fill: string; stroke: string }> = {
  maxSquare: { fill: "#7c3aed", stroke: "#6d28d9" },
  cluster: { fill: "#3b82f6", stroke: "#2563eb" },
  clusterBorder: { fill: "#93c5fd", stroke: "#60a5fa" },
  isolated: { fill: "#f87171", stroke: "#ef4444" },
};

interface ExplorerTilesLayerProps {
  activities: Doc<"activities">[] | null;
  visible: boolean;
}

export function ExplorerTilesLayer({
  activities,
  visible,
}: ExplorerTilesLayerProps) {
  const map = useMap();
  const tilesData = useExplorerTiles(activities);

  const layerRef = React.useRef<L.FeatureGroup | null>(null);
  const rendererRef = React.useRef<L.Canvas | null>(null);

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

  // Update rectangles when tiles data changes
  React.useEffect(() => {
    const layer = layerRef.current;
    const renderer = rendererRef.current;
    if (!layer || !renderer || !tilesData) {
      layer?.clearLayers();
      return;
    }

    layer.clearLayers();
    const { tiles } = tilesData;

    for (const tile of tiles) {
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
  }, [tilesData]);

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
