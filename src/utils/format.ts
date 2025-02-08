export const formatDuration = (seconds: number) => {
  if (seconds < 0) {
    return (seconds = -seconds);
  }

  const time = [
    Math.floor(seconds / 3600) % 24,
    Math.floor(seconds / 60) % 60,
    Math.floor(seconds) % 60,
  ];

  return time
    .map((value) => {
      if (value > 9) {
        return value;
      }

      return `0${value}`;
    })
    .join(":");
};

export const formatDistance = (meters: number) =>
  `${new Intl.NumberFormat().format(meters / 1000)}km`;

export const formatSpeed = (metersPerSecond: number, activityType: string) => {
  if (activityType === "Run") {
    const timePerKm = 1000 / metersPerSecond;
    const minutes = Math.floor(timePerKm / 60);
    return `${minutes}:${Math.floor(timePerKm - minutes * 60)} /km`;
  }

  return `${(metersPerSecond * 3.6).toFixed(1)} km/h`;
};

export function formatActivityType(activityType: string): string {
  return activityType.replace(/([A-Z])/g, " $1").trim();
}
