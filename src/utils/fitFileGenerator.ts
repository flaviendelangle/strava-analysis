import { FitWriter } from "@markw65/fit-file-writer";

import type { SessionDataPoint, SessionSummary } from "~/sensors/types";

export function generateFitFile(
  dataPoints: SessionDataPoint[],
  summary: SessionSummary,
): ArrayBuffer {
  const writer = new FitWriter();

  const startTime = summary.startTime;

  // File ID
  writer.writeMessage("file_id", {
    type: "activity",
    manufacturer: "development",
    product: 0,
    serial_number: 0,
    time_created: writer.time(startTime),
  });

  // Event: timer start
  writer.writeMessage("event", {
    timestamp: writer.time(startTime),
    event: "timer",
    event_type: "start",
  });

  // Record messages (one per second)
  for (const point of dataPoints) {
    const recordTime = new Date(point.timestamp);
    const record: Record<string, number | undefined> = {
      timestamp: writer.time(recordTime),
    };

    if (point.heartRate != null) record.heart_rate = point.heartRate;
    if (point.power != null) record.power = point.power;
    if (point.cadence != null) record.cadence = Math.round(point.cadence);
    if (point.speed != null) record.speed = point.speed;
    record.distance = point.distance;

    writer.writeMessage("record", record);
  }

  // Event: timer stop
  const endTime = new Date(
    dataPoints[dataPoints.length - 1]?.timestamp ?? startTime.getTime(),
  );
  writer.writeMessage("event", {
    timestamp: writer.time(endTime),
    event: "timer",
    event_type: "stop_all",
  });

  // Lap message
  const lapRecord: Record<string, number | string | undefined> = {
    timestamp: writer.time(endTime),
    start_time: writer.time(startTime),
    total_elapsed_time: summary.elapsedSeconds,
    total_timer_time: summary.elapsedSeconds,
    total_distance: summary.totalDistance,
    message_index: 0,
  };
  if (summary.avgPower != null) lapRecord.avg_power = summary.avgPower;
  if (summary.maxPower != null) lapRecord.max_power = summary.maxPower;
  if (summary.avgHeartRate != null)
    lapRecord.avg_heart_rate = summary.avgHeartRate;
  if (summary.maxHeartRate != null)
    lapRecord.max_heart_rate = summary.maxHeartRate;
  if (summary.avgCadence != null) lapRecord.avg_cadence = summary.avgCadence;
  if (summary.maxCadence != null) lapRecord.max_cadence = summary.maxCadence;
  writer.writeMessage("lap", lapRecord);

  // Session message
  const sessionRecord: Record<string, number | string | undefined> = {
    timestamp: writer.time(endTime),
    start_time: writer.time(startTime),
    total_elapsed_time: summary.elapsedSeconds,
    total_timer_time: summary.elapsedSeconds,
    total_distance: summary.totalDistance,
    sport: "cycling",
    sub_sport: "indoor_cycling",
    message_index: 0,
    first_lap_index: 0,
    num_laps: 1,
  };
  if (summary.avgPower != null) sessionRecord.avg_power = summary.avgPower;
  if (summary.maxPower != null) sessionRecord.max_power = summary.maxPower;
  if (summary.normalizedPower != null)
    sessionRecord.normalized_power = summary.normalizedPower;
  if (summary.avgHeartRate != null)
    sessionRecord.avg_heart_rate = summary.avgHeartRate;
  if (summary.maxHeartRate != null)
    sessionRecord.max_heart_rate = summary.maxHeartRate;
  if (summary.avgCadence != null)
    sessionRecord.avg_cadence = summary.avgCadence;
  if (summary.maxCadence != null)
    sessionRecord.max_cadence = summary.maxCadence;
  if (summary.avgSpeed != null) sessionRecord.avg_speed = summary.avgSpeed;
  if (summary.maxSpeed != null) sessionRecord.max_speed = summary.maxSpeed;
  writer.writeMessage("session", sessionRecord);

  // Activity message
  writer.writeMessage("activity", {
    timestamp: writer.time(endTime),
    total_timer_time: summary.elapsedSeconds,
    num_sessions: 1,
    type: "manual",
  });

  const dataView = writer.finish();
  return dataView.buffer.slice(
    dataView.byteOffset,
    dataView.byteOffset + dataView.byteLength,
  ) as ArrayBuffer;
}

export function downloadFitFile(buffer: ArrayBuffer, name?: string): void {
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    name ??
    `training_${new Date().toISOString().slice(0, 16).replace(":", "-")}.fit`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
