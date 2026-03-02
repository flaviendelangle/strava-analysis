import { Doc } from "../../convex/_generated/dataModel";
import { StatCard } from "~/components/primitives/StatCard";
import { useRiderSettingsTimeline } from "~/hooks/useRiderSettings";
import { formatHumanDuration } from "~/utils/format";
import { getSportConfig } from "~/utils/sportConfig";

interface ActivityStatsProps {
  activity: Doc<"activities">;
}

export function ActivityStats({ activity }: ActivityStatsProps) {
  const sportConfig = getSportConfig(activity.type);
  const { resolveForDate } = useRiderSettingsTimeline();
  const activityDate = activity.startDateLocal.slice(0, 10);
  const riderSettings = resolveForDate(activityDate);

  const np = activity.weightedAverageWatts ?? null;
  const ftp = riderSettings.ftp;
  const intensityFactor = np != null ? np / ftp : null;
  const tss = activity.tss ?? null;
  const hrss = activity.hrss ?? null;

  return (
    <div className="rounded-lg bg-card p-4">
      <h3 className="mb-3 text-lg font-medium">Activity Details</h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <StatCard
          label="Moving Time"
          value={formatHumanDuration(activity.movingTime)}
        />
        <StatCard
          label="Elapsed Time"
          value={formatHumanDuration(activity.elapsedTime)}
        />
        <StatCard label="Distance" value={sportConfig.formatDistance(activity.distance)} />
        <StatCard
          label="Elevation"
          value={`${activity.totalElevationGain} m`}
        />
        <StatCard
          label={`Avg ${sportConfig.speedLabel}`}
          value={sportConfig.formatSpeed(activity.averageSpeed)}
        />
        {activity.maxSpeed != null && (
          <StatCard
            label={`Max ${sportConfig.speedLabel}`}
            value={sportConfig.formatSpeed(activity.maxSpeed)}
          />
        )}
        {activity.averageHeartrate != null && (
          <StatCard
            label="Avg HR"
            value={`${Math.round(activity.averageHeartrate)} bpm`}
          />
        )}
        {activity.maxHeartrate != null && (
          <StatCard
            label="Max HR"
            value={`${Math.round(activity.maxHeartrate)} bpm`}
          />
        )}
        {activity.averageWatts != null && (
          <StatCard
            label="Avg Power"
            value={`${Math.round(activity.averageWatts)} W`}
          />
        )}
        {activity.maxWatts != null && (
          <StatCard
            label="Max Power"
            value={`${Math.round(activity.maxWatts)} W`}
          />
        )}
        {np != null && (
          <StatCard
            label="Normalized Power"
            value={`${Math.round(np)} W`}
          />
        )}
        {activity.averageCadence != null && (
          <StatCard
            label="Avg Cadence"
            value={`${Math.round(activity.averageCadence)} ${sportConfig.cadenceUnit}`}
          />
        )}
        {activity.kilojoules != null && (
          <StatCard
            label="Energy"
            value={`${Math.round(activity.kilojoules)} kJ`}
          />
        )}
        {activity.calories != null && (
          <StatCard
            label="Calories"
            value={`${Math.round(activity.calories)} kcal`}
          />
        )}
        {intensityFactor != null && (
          <StatCard
            label="Intensity Factor"
            value={intensityFactor.toFixed(2)}
            tooltip={
              <div className="flex flex-col gap-0.5">
                <div className="font-medium">Rider settings for {activityDate}</div>
                <div>FTP: {riderSettings.ftp} W</div>
              </div>
            }
          />
        )}
        {tss != null && (
          <StatCard
            label="TSS"
            value={Math.round(tss).toString()}
            tooltip={
              <div className="flex flex-col gap-0.5">
                <div className="font-medium">Rider settings for {activityDate}</div>
                <div>FTP: {riderSettings.ftp} W</div>
              </div>
            }
          />
        )}
        {hrss != null && (
          <StatCard
            label="HRSS"
            value={Math.round(hrss).toString()}
            tooltip={
              <div className="flex flex-col gap-0.5">
                <div className="font-medium">Rider settings for {activityDate}</div>
                <div>Resting HR: {riderSettings.restingHr} bpm</div>
                <div>Max HR: {riderSettings.maxHr} bpm</div>
                <div>LTHR: {riderSettings.lthr} bpm</div>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
