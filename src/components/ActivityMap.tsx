import type { Activity } from "@server/db/types";
import { Map } from "./Map";

export function ActivityMap(props: ActivityMapProps) {
  const { activity } = props;

  return <Map activities={activity == null ? [] : [activity]} />;
}

interface ActivityMapProps {
  activity: Activity | null | undefined;
}
