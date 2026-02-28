import { Doc } from "../../convex/_generated/dataModel";
import { Map } from "./Map";

export function ActivityMap(props: ActivityMapProps) {
  const { activity } = props;

  return <Map activities={activity == null ? [] : [activity]} />;
}

interface ActivityMapProps {
  activity: Doc<"activities"> | null | undefined;
}
