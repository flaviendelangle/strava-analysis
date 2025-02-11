import * as React from "react";

import "leaflet/dist/leaflet.css";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

import { decode } from "~/utils/polyline";
import { RouterOutput } from "~/utils/trpc";

const osm = {
  maptiler: {
    url: "https://api.maptiler.com/maps/basic/256/{z}/{x}/{y}.png?key=fXmTwJM642uPLZiwzhA1",
    attribution:
      '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  },
};

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
        if (!activity?.map_polyline) return null;
        return { id: activity.id, polyline: decode(activity.map_polyline) };
      })
      .filter((activity) => !!activity);
  }, [activities]);

  return (
    <MapContainer
      center={{ lat: 0, lng: 0 }}
      zoom={14}
      className="z-0 h-full w-full"
    >
      <TileLayer
        url={osm.maptiler.url}
        attribution={osm.maptiler.attribution}
      />
      {polylines?.map((activity) => (
        <Polyline key={activity.id} positions={activity.polyline} color="red" />
      ))}
      <FitBounds polylines={polylines} />
    </MapContainer>
  );
}

interface MapProps {
  activities: RouterOutput["strava"]["activitiesWithMap"] | null;
}
