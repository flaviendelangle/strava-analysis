import * as React from "react";

import { Loader2, RefreshCwIcon, HistoryIcon } from "lucide-react";
import { useAction } from "convex/react";

import { Button } from "~/components/ui/button";
import { useAthleteId } from "~/hooks/useAthleteId";

import { api } from "../../convex/_generated/api";

export function SyncActivitiesButtons() {
  const athleteId = useAthleteId();
  const checkForNew = useAction(api.actions.checkForNewActivities);
  const loadOlder = useAction(api.actions.loadOlderActivities);
  const [isCheckingNew, setIsCheckingNew] = React.useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        disabled={isCheckingNew}
        onClick={async () => {
          if (!athleteId) return;
          setIsCheckingNew(true);
          try {
            await checkForNew({ athleteId });
          } finally {
            setIsCheckingNew(false);
          }
        }}
      >
        {isCheckingNew ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <RefreshCwIcon className="size-3.5" />
        )}
        <span>Check for new</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        disabled={isLoadingOlder}
        onClick={async () => {
          if (!athleteId) return;
          setIsLoadingOlder(true);
          try {
            await loadOlder({ athleteId });
          } finally {
            setIsLoadingOlder(false);
          }
        }}
      >
        {isLoadingOlder ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <HistoryIcon className="size-3.5" />
        )}
        <span>Load older</span>
      </Button>
    </>
  );
}
