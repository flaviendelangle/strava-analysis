import { trpc } from "~/utils/trpc";

import { Map } from "./Map";

export function ActivityMap(props: ActivityMapProps) {
  const { activityId } = props;

  const activityQuery = trpc.strava.activityWithMap.useQuery({
    id: activityId,
  });

  return (
    <Map
      activities={activityQuery.data == null ? null : [activityQuery.data]}
    />
  );
}

interface ActivityMapProps {
  activityId: number;
}
