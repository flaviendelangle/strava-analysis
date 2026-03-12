import * as React from "react";

import { RotateCcwIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { useDismissedHints } from "~/hooks/useDismissedHints";

export function ResetHintsButton() {
  const { resetAll } = useDismissedHints();
  const [didReset, setDidReset] = React.useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={didReset}
      onClick={() => {
        resetAll();
        setDidReset(true);
      }}
    >
      <RotateCcwIcon className="size-3.5" />
      {didReset ? "Hints restored" : "Reset all hints"}
    </Button>
  );
}
