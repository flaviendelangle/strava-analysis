import type { Activity } from "@server/db/types";
import { Map } from "./Map";

export function ActivityMap(props: ActivityMapProps) {
  const { activity, highlightPosition, routePositions } = props;

  return (
    <Map
      activities={activity == null ? [] : [activity]}
      highlightPosition={highlightPosition}
      routePositions={routePositions}
    />
  );
}

interface ActivityMapProps {
  activity: Activity | null | undefined;
  highlightPosition?: [number, number] | null;
  routePositions?: [number, number][] | null;
}
