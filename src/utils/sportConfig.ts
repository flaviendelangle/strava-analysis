export class SportConfig {
  formatSpeed(metersPerSecond: number): string {
    return `${(metersPerSecond * 3.6).toFixed(1)} km/h`;
  }

  formatDistance(meters: number): string {
    return `${new Intl.NumberFormat().format(meters / 1000)}km`;
  }

  formatPreciseDistance(meters: number): string {
    return `${(meters / 1000).toFixed(2)} km`;
  }

  readonly speedLabel: string = "Speed";

  readonly cadenceUnit: string = "rpm";
}

class RunSportConfig extends SportConfig {
  formatSpeed(metersPerSecond: number): string {
    const timePerKm = 1000 / metersPerSecond;
    const minutes = Math.floor(timePerKm / 60);
    return `${minutes}:${String(Math.floor(timePerKm - minutes * 60)).padStart(2, "0")} /km`;
  }

  override readonly speedLabel: string = "Pace";

  override readonly cadenceUnit: string = "spm";
}

class SwimSportConfig extends SportConfig {
  formatSpeed(metersPerSecond: number): string {
    const timePer100m = 100 / metersPerSecond;
    const minutes = Math.floor(timePer100m / 60);
    return `${minutes}:${String(Math.floor(timePer100m - minutes * 60)).padStart(2, "0")} /100m`;
  }

  formatDistance(meters: number): string {
    return `${new Intl.NumberFormat().format(meters)}m`;
  }

  formatPreciseDistance(meters: number): string {
    return `${meters.toFixed(0)} m`;
  }

  override readonly speedLabel: string = "Pace";

  override readonly cadenceUnit: string = "spm";
}

const SPORT_CONFIGS: Record<string, SportConfig> = {
  Run: new RunSportConfig(),
  Swim: new SwimSportConfig(),
};

const DEFAULT_CONFIG = new SportConfig();

export function getSportConfig(activityType: string): SportConfig {
  return SPORT_CONFIGS[activityType] ?? DEFAULT_CONFIG;
}
