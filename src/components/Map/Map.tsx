import * as React from "react";

import "leaflet/dist/leaflet.css";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

import { decode } from "~/utils/polyline";
import { RouterOutput } from "~/utils/trpc";

// List available here: https://wiki.openstreetmap.org/wiki/Raster_tile_providers
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png	";

const TILE_ATTRIBUTION =
  'Map data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface FitBoundsProps {
  polylines: { id: number; polyline: [number, number][] }[];
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
  const { activities } = props;

  const polylines = React.useMemo(() => {
    return (activities ?? [])
      .map((activity) => {
        if (!activity?.mapPolyline) return null;
        return { id: activity.id, polyline: decode(activity.mapPolyline) };
      })
      .filter((activity) => !!activity);
  }, [activities]);

  return (
    <MapContainer
      center={{ lat: 0, lng: 0 }}
      zoom={14}
      className="z-0 h-full w-full"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {polylines?.map((activity) => (
        <Polyline key={activity.id} positions={activity.polyline} color="red" />
      ))}
      <FitBounds polylines={polylines} />
    </MapContainer>
  );
}

interface MapProps {
  activities: RouterOutput["activities"]["listActivitiesWithMap"] | null;
}
