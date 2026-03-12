import {
  POWER_BEST_ACTIVITY_TYPES,
  RUN_ACTIVITY_TYPES,
  SWIM_ACTIVITY_TYPES,
} from "./constants";

interface ActivityLike {
  type: string;
  hrss: number | null;
  tss: number | null;
}

export interface LoadAlgorithmPreferences {
  cyclingLoadAlgorithm: "tss" | "hrss";
  runningLoadAlgorithm: "rtss" | "hrss";
  swimmingLoadAlgorithm: "stss" | "hrss";
}

export interface LoadResult {
  value: number | null;
  label: string;
  tooltip: string;
}

const ALGORITHM_INFO = {
  tss: {
    label: "TSS",
    tooltip: "Training Stress Score (power-based)",
  },
  rtss: {
    label: "rTSS",
    tooltip: "Running Training Stress Score (pace-based)",
  },
  stss: {
    label: "sTSS",
    tooltip: "Swimming Training Stress Score (pace-based)",
  },
  hrss: {
    label: "HRSS",
    tooltip: "Heart Rate Stress Score",
  },
} as const;

type Algorithm = keyof typeof ALGORITHM_INFO;

export function getActivityLoad(
  activity: ActivityLike,
  preferences: LoadAlgorithmPreferences,
): LoadResult {
  let preferred: Algorithm;
  let sportSpecific: Algorithm;

  if (POWER_BEST_ACTIVITY_TYPES.includes(activity.type)) {
    preferred = preferences.cyclingLoadAlgorithm;
    sportSpecific = "tss";
  } else if (RUN_ACTIVITY_TYPES.includes(activity.type)) {
    preferred = preferences.runningLoadAlgorithm;
    sportSpecific = "rtss";
  } else if (SWIM_ACTIVITY_TYPES.includes(activity.type)) {
    preferred = preferences.swimmingLoadAlgorithm;
    sportSpecific = "stss";
  } else {
    preferred = "hrss";
    sportSpecific = "hrss";
  }

  // Resolve preferred value
  const preferredValue =
    preferred === "hrss" ? activity.hrss : activity.tss;

  if (preferredValue != null) {
    const info = ALGORITHM_INFO[preferred];
    return {
      value: preferredValue,
      label: info.label,
      tooltip: `Uses ${info.label} (${info.tooltip}).`,
    };
  }

  // Fallback: try the other value source
  const fallbackAlgorithm = preferred === "hrss" ? sportSpecific : "hrss";
  const fallbackValue =
    preferred === "hrss" ? activity.tss : activity.hrss;

  if (fallbackValue != null) {
    const info = ALGORITHM_INFO[fallbackAlgorithm];
    return {
      value: fallbackValue,
      label: info.label,
      tooltip: `Uses ${info.label} (${info.tooltip}).`,
    };
  }

  return { value: null, label: "", tooltip: "" };
}
