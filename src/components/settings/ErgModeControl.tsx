import { ZapIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { NumberField } from "~/components/ui/number-field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";
import { useErgMode } from "~/hooks/useErgMode";
import { cn } from "~/lib/utils";

export function ErgModeControl() {
  const { ergEnabled, setErgEnabled, targetPower, setTargetPower, supportsControl } =
    useErgMode();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant={ergEnabled ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "gap-1.5 text-muted-foreground",
              ergEnabled && "border border-primary/50 text-foreground",
            )}
            disabled={!supportsControl}
          />
        }
      >
        <ZapIcon className="size-3.5" />
        <span>ERG{ergEnabled ? ` ${targetPower}W` : ""}</span>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="flex flex-col gap-3">
          <Label className="flex items-center gap-2">
            <Switch
              checked={ergEnabled}
              onCheckedChange={(checked) => setErgEnabled(checked)}
            />
            ERG Mode
          </Label>
          {ergEnabled && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Target Power (W)</Label>
                <NumberField
                  value={targetPower}
                  onValueChange={(v) => setTargetPower(v ?? 150)}
                  min={50}
                  max={2000}
                  step={5}
                />
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setTargetPower(targetPower - 10)}
                >
                  -10
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setTargetPower(targetPower - 5)}
                >
                  -5
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setTargetPower(targetPower + 5)}
                >
                  +5
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setTargetPower(targetPower + 10)}
                >
                  +10
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
