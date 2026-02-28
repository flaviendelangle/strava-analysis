import type { ConnectionState } from "../types";

export interface BleDeviceInfo {
  name: string | null;
  id: string | null;
  state: ConnectionState;
}

export class BleConnection {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onDataCallback: ((event: Event) => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private disconnectHandler: (() => void) | null = null;

  get deviceInfo(): BleDeviceInfo {
    return {
      name: this.device?.name ?? null,
      id: this.device?.id ?? null,
      state: this.device?.gatt?.connected ? "connected" : "disconnected",
    };
  }

  async connect(params: {
    serviceUuid: number;
    characteristicUuid: number;
    optionalServices?: number[];
    onData: (event: Event) => void;
    onDisconnect: () => void;
  }): Promise<BluetoothDevice> {
    const {
      serviceUuid,
      characteristicUuid,
      optionalServices = [],
      onData,
      onDisconnect,
    } = params;

    this.onDataCallback = onData;
    this.onDisconnectCallback = onDisconnect;

    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [serviceUuid] }],
      optionalServices,
    });

    this.disconnectHandler = () => {
      this.onDisconnectCallback?.();
    };
    this.device.addEventListener(
      "gattserverdisconnected",
      this.disconnectHandler,
    );

    const server = await this.device.gatt!.connect();
    const service = await server.getPrimaryService(serviceUuid);
    this.characteristic = await service.getCharacteristic(characteristicUuid);

    await this.characteristic.startNotifications();
    this.characteristic.addEventListener(
      "characteristicvaluechanged",
      this.onDataCallback,
    );

    return this.device;
  }

  async disconnect(): Promise<void> {
    if (this.characteristic && this.onDataCallback) {
      try {
        this.characteristic.removeEventListener(
          "characteristicvaluechanged",
          this.onDataCallback,
        );
        await this.characteristic.stopNotifications();
      } catch {
        // Device may already be disconnected
      }
    }

    if (this.device && this.disconnectHandler) {
      this.device.removeEventListener(
        "gattserverdisconnected",
        this.disconnectHandler,
      );
    }

    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }

    this.device = null;
    this.characteristic = null;
    this.onDataCallback = null;
    this.disconnectHandler = null;
  }
}
