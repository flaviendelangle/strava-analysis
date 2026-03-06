import { GridIcon } from "lucide-react";

import { ActivitiesMap } from "~/components/ActivitiesMap";
import { ActivityFilterPopover } from "~/components/settings/ActivityFilterPopover";
import { Toolbar } from "~/components/settings/SettingsToolbar";
import { Button } from "~/components/ui/button";
import { useExplorerTilesToggle } from "~/hooks/useExplorerTilesToggle";
import { cn } from "~/lib/utils";
import { NextPageWithLayout } from "~/pages/_app";

function ExplorerTilesToggleButton() {
  const { showExplorerTiles, setShowExplorerTiles } = useExplorerTilesToggle();

  return (
    <Button
      variant={showExplorerTiles ? "secondary" : "ghost"}
      size="sm"
      className={cn(
        "text-muted-foreground gap-1.5",
        showExplorerTiles && "border-primary/50 text-foreground border",
      )}
      onClick={() => setShowExplorerTiles((prev) => !prev)}
    >
      <GridIcon className="size-3.5" />
      <span>Tiles</span>
    </Button>
  );
}

const HeatmapPage: NextPageWithLayout = () => {
  return (
    <>
      <Toolbar>
        <ActivityFilterPopover />
        <div className="bg-border mx-1 h-4 w-px" />
        <ExplorerTilesToggleButton />
      </Toolbar>
      <div className="flex-1 overflow-hidden">
        <ActivitiesMap />
      </div>
    </>
  );
};

export const dynamic = "force-dynamic";

export default HeatmapPage;
