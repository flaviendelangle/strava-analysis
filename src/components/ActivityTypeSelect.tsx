import * as React from "react";

import { Label } from "~/components/ui/label";
import { useActivitiesQuery } from "~/hooks/useActivitiesQuery";
import { formatActivityType } from "~/utils/format";

import { Select, SelectProps } from "./primitives/Select";

export function ActivityTypeSelect(props: Omit<SelectProps, "options">) {
  const { allTypes: activityTypes } = useActivitiesQuery();

  const options = React.useMemo<ActivityTypeConfig[]>(() => {
    return (
      activityTypes?.map((activityType) => ({
        value: activityType,
        label: formatActivityType(activityType),
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
