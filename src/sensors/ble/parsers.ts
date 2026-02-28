import type { HeartRateData, TrainerData } from "../types";

/**
 * Parses the Heart Rate Measurement BLE characteristic (0x2A37).
 *
 * Byte layout:
 *  - Byte 0: Flags
 *    - Bit 0: HR format (0 = UINT8, 1 = UINT16)
 *    - Bit 1-2: Sensor contact status
 *    - Bit 3: Energy expended present
 *    - Bit 4: RR-interval present
 *  - Byte 1+: HR value, then optional fields in order
 */
export function parseHeartRateMeasurement(
  dataView: DataView,
): HeartRateData | null {
  if (dataView.byteLength < 2) return null;

  const flags = dataView.getUint8(0);
  const is16Bit = (flags & 0x01) === 1;
  const sensorContactSupported = ((flags >> 1) & 0x01) === 1;
  const sensorContact = ((flags >> 2) & 0x01) === 1;
  const hasEnergyExpended = ((flags >> 3) & 0x01) === 1;
  const hasRrInterval = ((flags >> 4) & 0x01) === 1;

  let offset = 1;

  const heartRate = is16Bit
    ? dataView.getUint16(offset, true)
    : dataView.getUint8(offset);
  offset += is16Bit ? 2 : 1;

  let energyExpended: number | undefined;
  if (hasEnergyExpended) {
    energyExpended = dataView.getUint16(offset, true);
    offset += 2;
  }

  const rrIntervals: number[] = [];
  if (hasRrInterval) {
    while (offset + 1 < dataView.byteLength) {
      // RR intervals are in 1/1024 seconds, convert to ms
      const rrRaw = dataView.getUint16(offset, true);
      rrIntervals.push((rrRaw / 1024) * 1000);
      offset += 2;
    }
  }

  return {
    heartRate,
    sensorContact: sensorContactSupported ? sensorContact : undefined,
    energyExpended,
    rrIntervals: rrIntervals.length > 0 ? rrIntervals : undefined,
  };
}

/**
 * Parses the FTMS Indoor Bike Data characteristic (0x2AD2).
 *
 * Uses a 16-bit flags field to determine which data fields are present.
 * Fields appear in a fixed order, each conditionally present based on flags.
 */
export function parseIndoorBikeData(dataView: DataView): TrainerData | null {
  if (dataView.byteLength < 2) return null;

  const flags = dataView.getUint16(0, true);
  let offset = 2;

  const result: TrainerData = {};

  // Bit 0: More Data - if 0, instantaneous speed IS present
  if ((flags & 0x01) === 0) {
    result.speed = (dataView.getUint16(offset, true) * 0.01) / 3.6; // 0.01 km/h → m/s
    offset += 2;
  }

  // Bit 1: Average speed present
  if (flags & 0x02) {
    offset += 2; // skip average speed
  }

  // Bit 2: Instantaneous cadence present
  if (flags & 0x04) {
    result.cadence = dataView.getUint16(offset, true) * 0.5; // rpm
    offset += 2;
  }

  // Bit 3: Average cadence present
  if (flags & 0x08) {
    offset += 2; // skip
  }

  // Bit 4: Total distance present (3 bytes)
  if (flags & 0x10) {
    result.distance =
      dataView.getUint16(offset, true) +
      (dataView.getUint8(offset + 2) << 16); // meters
    offset += 3;
  }

  // Bit 5: Resistance level present
  if (flags & 0x20) {
    result.resistanceLevel = dataView.getInt16(offset, true);
    offset += 2;
  }

  // Bit 6: Instantaneous power present
  if (flags & 0x40) {
    result.power = dataView.getInt16(offset, true); // watts
    offset += 2;
  }

  // Bit 7: Average power present
  if (flags & 0x80) {
    offset += 2; // skip
  }

  // Bit 8: Expended energy present (total 2B + per hour 2B + per minute 1B)
  if (flags & 0x100) {
    offset += 5; // skip
  }

  // Bit 9: Heart rate present
  if (flags & 0x200) {
    result.heartRate = dataView.getUint8(offset); // bpm
    offset += 1;
  }

  return result;
}

// State for computing cadence from CPS crank revolution data
let prevCrankRevolutions: number | null = null;
let prevCrankEventTime: number | null = null;

/**
 * Resets the CPS cadence computation state.
 * Call this when reconnecting to a power meter.
 */
export function resetCpsCadenceState(): void {
  prevCrankRevolutions = null;
  prevCrankEventTime = null;
}

/**
 * Parses the Cycling Power Measurement characteristic (0x2A63).
 *
 * Instantaneous power is always present at offset 2 (Int16LE).
 * Optional crank revolution data is used to compute cadence.
 */
export function parseCyclingPowerMeasurement(
  dataView: DataView,
): TrainerData | null {
  if (dataView.byteLength < 4) return null;

  const flags = dataView.getUint16(0, true);
  let offset = 2;

  const result: TrainerData = {};

  // Instantaneous power is always present
  result.power = dataView.getInt16(offset, true); // watts
  offset += 2;

  // Bit 0: Pedal power balance present
  if (flags & 0x01) {
    offset += 1;
  }

  // Bit 1: Pedal power balance reference
  // (no data field, just modifies interpretation)

  // Bit 2: Accumulated torque present
  if (flags & 0x04) {
    offset += 2;
  }

  // Bit 3: Accumulated torque source
  // (no data field)

  // Bit 4: Wheel revolution data present
  if (flags & 0x10) {
    offset += 6; // cumulative wheel revolutions (4B) + last wheel event time (2B)
  }

  // Bit 5: Crank revolution data present
  if (flags & 0x20) {
    const crankRevolutions = dataView.getUint16(offset, true);
    const crankEventTime = dataView.getUint16(offset + 2, true); // 1/1024 seconds

    if (
      prevCrankRevolutions !== null &&
      prevCrankEventTime !== null &&
      crankRevolutions !== prevCrankRevolutions
    ) {
      let revDelta = crankRevolutions - prevCrankRevolutions;
      let timeDelta = crankEventTime - prevCrankEventTime;

      // Handle rollover (UINT16 wraps at 65535)
      if (revDelta < 0) revDelta += 65536;
      if (timeDelta < 0) timeDelta += 65536;

      if (timeDelta > 0) {
        // Convert: (revolutions / (time_in_1024ths / 1024)) * 60 = RPM
        result.cadence = (revDelta / (timeDelta / 1024)) * 60;
      }
    }

    prevCrankRevolutions = crankRevolutions;
    prevCrankEventTime = crankEventTime;
    offset += 4;
  }

  return result;
}
