import { RouterOutput } from "~/utils/trpc";

import { Map } from "./Map";

export function ActivityMap(props: ActivityMapProps) {
  const { activity } = props;

  return <Map activities={activity == null ? [] : [activity]} />;
}

interface ActivityMapProps {
  activity: RouterOutput["activities"]["getActivityWithMap"];
}
