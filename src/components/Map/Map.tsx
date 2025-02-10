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
  positions: [number, number][];
}

function FitBounds(props: FitBoundsProps) {
  const { positions } = props;
  const map = useMap();

  React.useEffect(() => {
    if (positions.length > 0) {
      const bounds = positions.map(
        (pos) => [pos[0], pos[1]] as [number, number],
      );
      map.fitBounds(bounds);
    }
  }, [positions, map]);

  return null;
}

export default function Map(props: MapProps) {
  const { activity } = props;

  const polyline = React.useMemo(() => {
    if (!activity?.map_polyline) return null;
    return decode(activity.map_polyline);
  }, [activity]);

  return (
    <MapContainer
      center={{ lat: 0, lng: 0 }}
      zoom={14}
      className="h-full w-full"
    >
      <TileLayer
        url={osm.maptiler.url}
        attribution={osm.maptiler.attribution}
      />
      {!!polyline && (
        <React.Fragment>
          <Polyline positions={polyline} color="red" />
          <FitBounds positions={polyline} />
        </React.Fragment>
      )}
    </MapContainer>
  );
}

interface MapProps {
  activity: RouterOutput["strava"]["activityWithMap"] | null;
}
