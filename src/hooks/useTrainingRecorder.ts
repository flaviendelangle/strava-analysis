import { useCallback, useRef, useState } from "react";

import type { SessionDataPoint, SessionSummary } from "~/sensors/types";

export function useTrainingRecorder() {
  const dataPointsRef = useRef<SessionDataPoint[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const addDataPoint = useCallback(
    (data: {
      power: number | null;
      heartRate: number | null;
      cadence: number | null;
      speed: number | null;
      elapsed: number;
    }) => {
      if (!startTimeRef.current) {
        startTimeRef.current = new Date();
      }

      const points = dataPointsRef.current;
      const prevDistance = points.length > 0 ? points[points.length - 1].distance : 0;
      // speed is in m/s, 1 second interval -> add speed meters
      const distanceIncrement = data.speed != null && data.speed > 0 ? data.speed : 0;

      points.push({
        timestamp: Date.now(),
        elapsed: data.elapsed,
        power: data.power,
        heartRate: data.heartRate,
        cadence: data.cadence,
        speed: data.speed,
        distance: prevDistance + distanceIncrement,
      });
    },
    [],
  );

  const computeSummary = useCallback((): SessionSummary | null => {
    const points = dataPointsRef.current;
    if (points.length === 0) return null;

    const powers = points.map((p) => p.power).filter((v): v is number => v !== null);
    const heartRates = points.map((p) => p.heartRate).filter((v): v is number => v !== null);
    const cadences = points.map((p) => p.cadence).filter((v): v is number => v !== null);
    const speeds = points.map((p) => p.speed).filter((v): v is number => v !== null);

    const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    const max = (arr: number[]) => (arr.length > 0 ? Math.max(...arr) : null);

    // Normalized Power: 30s rolling average -> 4th power -> mean -> 4th root
    let normalizedPower: number | null = null;
    if (powers.length >= 30) {
      const rollingAvg: number[] = [];
      for (let i = 29; i < powers.length; i++) {
        let sum = 0;
        for (let j = i - 29; j <= i; j++) sum += powers[j];
        rollingAvg.push(sum / 30);
      }
      const fourthPowerMean =
        rollingAvg.reduce((acc, v) => acc + Math.pow(v, 4), 0) / rollingAvg.length;
      normalizedPower = Math.round(Math.pow(fourthPowerMean, 0.25));
    }

    const result: SessionSummary = {
      startTime: startTimeRef.current ?? new Date(),
      elapsedSeconds: points[points.length - 1].elapsed,
      totalDistance: points[points.length - 1].distance,
      avgPower: avg(powers) !== null ? Math.round(avg(powers)!) : null,
      maxPower: max(powers),
      normalizedPower,
      avgHeartRate: avg(heartRates) !== null ? Math.round(avg(heartRates)!) : null,
      maxHeartRate: max(heartRates),
      avgCadence: avg(cadences) !== null ? Math.round(avg(cadences)!) : null,
      maxCadence: max(cadences),
      avgSpeed: avg(speeds),
      maxSpeed: max(speeds),
    };

    setSummary(result);
    return result;
  }, []);

  const getDataPoints = useCallback(() => dataPointsRef.current, []);

  const clear = useCallback(() => {
    dataPointsRef.current = [];
    startTimeRef.current = null;
    setSummary(null);
  }, []);

  return { addDataPoint, computeSummary, getDataPoints, summary, clear };
}
