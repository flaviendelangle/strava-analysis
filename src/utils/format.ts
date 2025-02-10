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
