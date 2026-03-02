export const formatDuration = (seconds: number) => {
  if (seconds < 0) {
    seconds = -seconds;
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

export const formatHumanDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};


export function formatActivityType(activityType: string): string {
  return activityType.replace(/([A-Z])/g, " $1").trim();
}
