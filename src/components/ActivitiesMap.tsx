import { useActivitiesWithMapQuery } from "~/hooks/useActivitiesWithMapQuery";

import { Map } from "./Map";

export function ActivitiesMap() {
  const activitiesQuery = useActivitiesWithMapQuery();

  return <Map activities={activitiesQuery.data ?? null} enableExplorerTiles />;
}
