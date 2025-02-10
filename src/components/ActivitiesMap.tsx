import { trpc } from "~/utils/trpc";

import { Map } from "./Map";

export function ActivitiesMap() {
  const activitiesQuery = trpc.strava.activitiesWithMap.useQuery();

  return <Map activities={activitiesQuery.data ?? null} />;
}
