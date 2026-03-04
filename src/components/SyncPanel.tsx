import * as React from "react";

import {
  AlertCircleIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  Loader2,
  RefreshCwIcon,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useAthleteId } from "~/hooks/useAthleteId";
import { trpc } from "~/utils/trpc";

function ProgressBar(props: { value: number; max: number }) {
  const pct = props.max > 0 ? Math.round((props.value / props.max) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-1.5 flex-1 rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-muted-foreground min-w-[3ch] text-right text-xs tabular-nums">
        {pct}%
      </span>
    </div>
  );
}

function SyncProgress(props: {
  syncJob: {
    status: string;
    activitiesFetched: number;
    activitiesPagesComplete: boolean;
    streamsTotal: number;
    streamsFetched: number;
  };
}) {
  const { syncJob } = props;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
        <Loader2 className="size-3 animate-spin" />
        Syncing Strava data...
      </div>

      {/* Activities phase */}
      <div className="flex items-center gap-2">
        {syncJob.activitiesPagesComplete ? (
          <CheckCircle2Icon className="size-3.5 shrink-0 text-green-500" />
        ) : (
          <Loader2 className="text-muted-foreground size-3.5 shrink-0 animate-spin" />
        )}
        <span className="text-xs">
          Activities: {syncJob.activitiesFetched} loaded
        </span>
      </div>

      {/* Streams phase */}
      {syncJob.status === "fetching_activities" && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <div className="size-3.5 shrink-0" />
          <span>Streams: waiting...</span>
        </div>
      )}
      {(syncJob.status === "fetching_streams" ||
        syncJob.status === "computing_scores") && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {syncJob.status === "computing_scores" ? (
              <CheckCircle2Icon className="size-3.5 shrink-0 text-green-500" />
            ) : (
              <Loader2 className="text-muted-foreground size-3.5 shrink-0 animate-spin" />
            )}
            <span className="text-xs">
              Streams: {syncJob.streamsFetched} / {syncJob.streamsTotal}
            </span>
          </div>
          {syncJob.streamsTotal > 0 && (
            <div className="pl-5.5">
              <ProgressBar
                value={syncJob.streamsFetched}
                max={syncJob.streamsTotal}
              />
            </div>
          )}
        </div>
      )}

      {/* Score computation phase */}
      {syncJob.status === "computing_scores" && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Loader2 className="size-3.5 shrink-0 animate-spin" />
          <span>Computing training scores...</span>
        </div>
      )}
    </div>
  );
}

export function SyncPanel() {
  const athleteId = useAthleteId();
  const { data: syncJob } = trpc.sync.getJob.useQuery(
    { athleteId: athleteId! },
    {
      enabled: athleteId != null,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (data && data.status !== "completed" && data.status !== "failed") {
          return 3000;
        }
        return false;
      },
    },
  );
  const startSync = trpc.sync.start.useMutation();
  const forceResync = trpc.sync.forceResync.useMutation();
  const recomputeScores = trpc.riderSettings.recomputeScores.useMutation();
  const utils = trpc.useUtils();
  const [recomputing, setRecomputing] = React.useState(false);

  const wasSyncingRef = React.useRef(false);

  const isInProgress =
    syncJob != null &&
    syncJob.status !== "completed" &&
    syncJob.status !== "failed";

  React.useEffect(() => {
    if (isInProgress) {
      wasSyncingRef.current = true;
      utils.activities.list.invalidate();
    } else if (wasSyncingRef.current) {
      wasSyncingRef.current = false;
      utils.activities.list.invalidate();
      utils.activities.get.invalidate();
    }
  }, [syncJob, isInProgress, utils]);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5"
          >
            {isInProgress ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCwIcon className="size-3.5" />
            )}
            <span>Sync</span>
            {isInProgress && (
              <span className="bg-primary/20 text-primary-foreground size-1.5 rounded-full" />
            )}
            {syncJob?.status === "failed" && (
              <span className="size-1.5 rounded-full bg-red-500" />
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-64 p-3">
        {isInProgress ? (
          <SyncProgress syncJob={syncJob} />
        ) : (
          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-1.5"
              onClick={async () => {
                if (!athleteId) return;
                await startSync.mutateAsync({ athleteId });
                utils.sync.getJob.invalidate();
              }}
            >
              <RefreshCwIcon className="size-3.5" />
              Sync all data
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-1.5"
              onClick={async () => {
                if (!athleteId) return;
                await forceResync.mutateAsync({ athleteId });
                utils.sync.getJob.invalidate();
              }}
            >
              <RefreshCwIcon className="size-3.5" />
              Force full re-sync
            </Button>
            <span className="text-muted-foreground text-xs">
              Re-downloads all routes and streams
            </span>

            {syncJob?.status === "failed" && syncJob.lastError && (
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircleIcon className="size-3.5 shrink-0" />
                <span>Last sync failed</span>
              </div>
            )}

            {syncJob?.status === "completed" && (
              <span className="text-muted-foreground text-xs">
                Last synced:{" "}
                {new Date(syncJob.startedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}

            <div className="border-border border-t" />

            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-1.5"
              disabled={recomputing}
              onClick={async () => {
                if (!athleteId) return;
                setRecomputing(true);
                try {
                  await recomputeScores.mutateAsync({ athleteId });
                  utils.activities.list.invalidate();
                  utils.activities.get.invalidate();
                } finally {
                  setRecomputing(false);
                }
              }}
            >
              {recomputing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CalculatorIcon className="size-3.5" />
              )}
              Recompute all scores
            </Button>
            <span className="text-muted-foreground text-xs">
              Recalculate scores using current settings
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
