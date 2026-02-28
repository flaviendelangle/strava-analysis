import { FilterIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

import {
  ActivityTypeFilter,
  useActivityTypeFilterCount,
} from "./ActivityTypeFilter";

export function ActivityTypeFilterPopover() {
  const selectedCount = useActivityTypeFilterCount();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5"
          >
            <FilterIcon className="size-3.5" />
            <span>Filter</span>
            {selectedCount > 0 && (
              <span className="bg-primary/20 text-primary-foreground rounded px-1 text-xs">
                {selectedCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-48 p-3">
        <div className="text-muted-foreground mb-2 text-xs font-medium">
          Activity Types
        </div>
        <ActivityTypeFilter />
      </PopoverContent>
    </Popover>
  );
}
