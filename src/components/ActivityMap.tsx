import * as React from "react";

import type { Activity } from "@server/db/types";

import { Map } from "./Map";

export function ActivityMap(props: ActivityMapProps) {
  const { activity, highlightPosition, routePositions } = props;

  const activities = React.useMemo(
    () => (activity == null ? [] : [activity]),
    [activity],
  );

  return (
    <Map
      activities={activities}
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
