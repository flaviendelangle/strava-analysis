import { GridIcon } from "lucide-react";

import { SyncPanel } from "~/components/SyncPanel";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useCurrentPageSettings } from "~/hooks/useCurrentPageSettings";
import { useExplorerTilesToggle } from "~/hooks/useExplorerTilesToggle";

import { ActivityTypeFilterPopover } from "./ActivityTypeFilterPopover";
import { ErgModeControl } from "./ErgModeControl";

function ExplorerTilesToggleButton() {
  const { showExplorerTiles, setShowExplorerTiles } = useExplorerTilesToggle();

  return (
    <Button
      variant={showExplorerTiles ? "secondary" : "ghost"}
      size="sm"
      className={cn(
        "gap-1.5 text-muted-foreground",
        showExplorerTiles && "border border-primary/50 text-foreground",
      )}
      onClick={() => setShowExplorerTiles((prev) => !prev)}
    >
      <GridIcon className="size-3.5" />
      <span>Tiles</span>
    </Button>
  );
}

export function SettingsToolbar() {
  const {
    hasActivityTypeFilter,
    hasErgModeControl,
    hasExplorerTilesToggle,
    hasSyncPanel,
    hideSettings,
  } = useCurrentPageSettings();

  if (hideSettings) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-4 py-1.5">
      {hasActivityTypeFilter && <ActivityTypeFilterPopover />}

      {hasExplorerTilesToggle && (
        <>
          <div className="mx-1 h-4 w-px bg-border" />
          <ExplorerTilesToggleButton />
        </>
      )}

      {hasErgModeControl && <ErgModeControl />}

      {hasSyncPanel && (
        <>
          <div className="mx-1 h-4 w-px bg-border" />
          <SyncPanel />
        </>
      )}
    </div>
  );
}
