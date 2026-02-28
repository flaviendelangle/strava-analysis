import * as React from "react";

import { useQuery } from "convex/react";

import { Label } from "~/components/ui/label";
import { useAthleteId } from "~/hooks/useAthleteId";

import { api } from "../../convex/_generated/api";
import { Select, SelectProps } from "./primitives/Select";

export function ActivityTypeSelect(props: Omit<SelectProps, "options">) {
  const athleteId = useAthleteId();
  const activityTypes = useQuery(
    api.queries.activityTypes,
    athleteId != null ? { athleteId } : "skip",
  );

  const options = React.useMemo<ActivityTypeConfig[]>(() => {
    return (
      activityTypes?.map((activityType) => ({
        value: activityType,
        label: activityType,
      })) ?? []
    );
  }, [activityTypes]);

  return (
    <div className="flex w-full items-center justify-between gap-1 align-baseline">
      <Label className="text-foreground">Name</Label>
      <Select {...props} options={options} />
    </div>
  );
}

interface ActivityTypeConfig {
  value: string;
  label: string;
}
