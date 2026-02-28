import { SettingsIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { NumberField } from "~/components/ui/number-field";
import { useRiderSettings } from "~/hooks/useRiderSettings";
import type { RiderSettings } from "~/sensors/types";

export function RiderSettingsDialog() {
  const [settings, setRiderSettings] = useRiderSettings();
  const [draft, setDraft] = useState(settings);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setDraft(settings);
    setOpen(true);
  };

  const handleSave = () => {
    setRiderSettings(draft);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        onClick={handleOpen}
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5"
          />
        }
      >
        <SettingsIcon className="size-3.5" />
        <span>Rider</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rider Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Weight (rider + bike) kg</Label>
            <NumberField
              value={draft.weightKg}
              onValueChange={(value) =>
                setDraft({ ...draft, weightKg: value ?? 0 })
              }
              min={0}
              step={1}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>FTP (watts)</Label>
            <NumberField
              value={draft.ftp}
              onValueChange={(value) =>
                setDraft({ ...draft, ftp: value ?? 0 })
              }
              min={0}
              step={1}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>CdA (drag coefficient x area)</Label>
            <NumberField
              value={draft.cdA}
              onValueChange={(value) =>
                setDraft({ ...draft, cdA: value ?? 0 })
              }
              min={0}
              step={0.01}
              smallStep={0.001}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Crr (rolling resistance)</Label>
            <NumberField
              value={draft.crr}
              onValueChange={(value) =>
                setDraft({ ...draft, crr: value ?? 0 })
              }
              min={0}
              step={0.001}
              smallStep={0.0001}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
