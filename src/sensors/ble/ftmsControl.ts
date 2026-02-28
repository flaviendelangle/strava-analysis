/**
 * FTMS Control Point (0x2AD9) protocol wrapper.
 *
 * Op codes:
 * - 0x00  Request Control
 * - 0x01  Reset
 * - 0x05  Set Target Power (Uint16LE watts)
 *
 * Response notifications: [0x80, requestOpCode, resultCode]
 *   resultCode 0x01 = success
 */
export class FtmsControlPoint {
  private characteristic: BluetoothRemoteGATTCharacteristic;
  private hasControl = false;

  constructor(characteristic: BluetoothRemoteGATTCharacteristic) {
    this.characteristic = characteristic;
  }

  async startNotifications(
    onResponse?: (opCode: number, result: number) => void,
  ): Promise<void> {
    await this.characteristic.startNotifications();
    this.characteristic.addEventListener(
      "characteristicvaluechanged",
      (event) => {
        const dv = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (dv && dv.byteLength >= 3 && dv.getUint8(0) === 0x80) {
          onResponse?.(dv.getUint8(1), dv.getUint8(2));
        }
      },
    );
  }

  async requestControl(): Promise<void> {
    await this.characteristic.writeValueWithResponse(new Uint8Array([0x00]));
    this.hasControl = true;
  }

  async setTargetPower(watts: number): Promise<void> {
    if (!this.hasControl) {
      await this.requestControl();
    }
    const clamped = Math.max(0, Math.min(4000, Math.round(watts)));
    const buf = new ArrayBuffer(3);
    const dv = new DataView(buf);
    dv.setUint8(0, 0x05);
    dv.setUint16(1, clamped, true);
    await this.characteristic.writeValueWithResponse(new Uint8Array(buf));
  }

  async reset(): Promise<void> {
    try {
      await this.characteristic.writeValueWithResponse(new Uint8Array([0x01]));
    } catch {
      // Trainer may already be disconnected
    }
    this.hasControl = false;
  }

  async dispose(): Promise<void> {
    try {
      await this.characteristic.stopNotifications();
    } catch {
      // Already disconnected
    }
    this.hasControl = false;
  }
}
