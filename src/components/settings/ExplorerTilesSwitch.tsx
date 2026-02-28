import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { useExplorerTilesToggle } from "~/hooks/useExplorerTilesToggle";

export function ExplorerTilesSwitch() {
  const { showExplorerTiles, setShowExplorerTiles } = useExplorerTilesToggle();

  return (
    <Label className="flex items-center gap-2">
      <Switch
        checked={showExplorerTiles}
        onCheckedChange={(checked) => setShowExplorerTiles(checked)}
      />
      Explorer Tiles
    </Label>
  );
}
