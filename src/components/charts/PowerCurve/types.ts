export interface ActivityInfo {
  activityStravaId: number;
  activityName: string;
  activityStartDate: string;
}

export interface PowerCurveSeriesData {
  id: string;
  label: string;
  color: string;
  /** Watts values aligned with xData. null = no data at that duration. */
  yData: (number | null)[];
  /** Weight in kg for each data point (used for W/kg). null = unknown weight. */
  weights?: (number | null)[];
}
