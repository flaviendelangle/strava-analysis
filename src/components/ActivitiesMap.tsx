import { useActivitiesWithMapQuery } from "~/hooks/trpc/useActivitiesWithMapQuery";

import { Map } from "./Map";

export function ActivitiesMap() {
  const activitiesQuery = useActivitiesWithMapQuery();

  return <Map activities={activitiesQuery.data ?? null} />;
}
