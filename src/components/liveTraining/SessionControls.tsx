import { useState } from "react";

import type { SessionState } from "~/hooks/useTrainingSession";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

interface SessionControlsProps {
  state: SessionState;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function SessionControls(props: SessionControlsProps) {
  const { state, onPause, onResume, onStop } = props;
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  if (state === "idle") {
    return (
      <div className="flex justify-center">
        <p className="text-lg text-muted-foreground">Pedal to start recording</p>
      </div>
    );
  }

  if (state === "stopped") {
    return null;
  }

  return (
    <div className="flex justify-center gap-4">
      {state === "running" ? (
        <Button onClick={onPause} size="lg" className="bg-yellow-600 px-6 text-lg font-bold hover:bg-yellow-500">
          Pause
        </Button>
      ) : (
        <Button onClick={onResume} size="lg" className="bg-green-600 px-6 text-lg font-bold hover:bg-green-500">
          Resume
        </Button>
      )}

      <Dialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
        <DialogTrigger render={
          <Button variant="destructive" size="lg" className="px-6 text-lg font-bold" />
        }>
          Stop
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop session?</DialogTitle>
            <DialogDescription>
              Are you sure you want to stop this training session?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStopConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowStopConfirm(false);
                onStop();
              }}
            >
              Stop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
