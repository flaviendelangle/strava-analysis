import * as React from "react";

import "leaflet/dist/leaflet.css";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";

import type { Activity } from "@server/db/types";

import { useExplorerTilesToggle } from "~/hooks/useExplorerTilesToggle";
import { decode } from "~/utils/polyline";

import { ExplorerTilesLayer } from "./ExplorerTilesLayer";
import { ExplorerTilesStats } from "./ExplorerTilesStats";

// List available here: https://wiki.openstreetmap.org/wiki/Raster_tile_providers
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const TILE_ATTRIBUTION =
  'Map data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface FitBoundsProps {
  polylines: { id: string; polyline: [number, number][] }[];
}

function FitBounds(props: FitBoundsProps) {
  const { polylines } = props;
  const map = useMap();

  React.useEffect(() => {
    const positions = polylines[0]?.polyline ?? [];
    if (positions.length > 0) {
      const bounds = positions.map(
        (pos) => [pos[0], pos[1]] as [number, number],
      );
      map.fitBounds(bounds);
    }
  }, [polylines, map]);

  return null;
}

export default function Map(props: MapProps) {
  const {
    activities,
    enableExplorerTiles = false,
    highlightPosition,
    routePositions,
  } = props;
  const { showExplorerTiles } = useExplorerTilesToggle();

  const polylines = React.useMemo(() => {
    if (routePositions) {
      return [{ id: "latlng", polyline: routePositions }];
    }
    return (activities ?? [])
      .map((activity) => {
        if (!activity?.mapPolyline) return null;
        return {
          id: String(activity.id),
          polyline: decode(activity.mapPolyline),
        };
      })
      .filter((activity) => !!activity);
  }, [activities, routePositions]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={{ lat: 0, lng: 0 }}
        zoom={14}
        className="z-0 h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        {enableExplorerTiles && (
          <ExplorerTilesLayer
            activities={activities}
            visible={showExplorerTiles}
          />
        )}
        {polylines?.map((activity) => (
          <Polyline
            key={activity.id}
            positions={activity.polyline}
            color="red"
          />
        ))}
        {highlightPosition && (
          <CircleMarker
            center={highlightPosition}
            radius={6}
            pathOptions={{
              color: "white",
              fillColor: "#3b82f6",
              fillOpacity: 1,
              weight: 2,
            }}
          />
        )}
        <FitBounds polylines={polylines} />
      </MapContainer>
      {enableExplorerTiles && (
        <ExplorerTilesStats
          activities={activities}
          visible={showExplorerTiles}
        />
      )}
    </div>
  );
}

interface MapProps {
  activities: Activity[] | null;
  enableExplorerTiles?: boolean;
  highlightPosition?: [number, number] | null;
  routePositions?: [number, number][] | null;
}
