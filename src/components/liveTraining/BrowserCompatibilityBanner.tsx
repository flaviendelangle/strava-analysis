import { useSyncExternalStore } from "react";

interface Capabilities {
  bluetooth: boolean;
  usb: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};
const subscribe = () => noop;

let cachedCapabilities: Capabilities | undefined;
function getCapabilities(): Capabilities {
  if (!cachedCapabilities) {
    cachedCapabilities = {
      bluetooth: !!navigator.bluetooth,
      usb: !!(navigator as Navigator & { usb?: unknown }).usb,
    };
  }
  return cachedCapabilities;
}

function getServerCapabilities(): null {
  return null;
}

export function BrowserCompatibilityBanner() {
  const capabilities = useSyncExternalStore(subscribe, getCapabilities, getServerCapabilities);

  // Still server-rendering or both APIs available — nothing to show
  if (!capabilities || (capabilities.bluetooth && capabilities.usb)) return null;

  const noBle = !capabilities.bluetooth;
  const noUsb = !capabilities.usb;

  // If only BLE is missing but ANT+ (USB) is available, no need to warn
  if (noBle && !noUsb) return null;

  return (
    <div className="mb-4 rounded-md border border-yellow-600 bg-yellow-900/30 px-4 py-3 text-sm text-yellow-200">
      {noBle && noUsb ? (
        <p>
          Web Bluetooth and WebUSB are not available. BLE and ANT+ sensors will
          not work. Please use Chrome, Edge, or Brave on desktop.
        </p>
      ) : (
        <p>
          WebUSB is not available — ANT+ sensors will not work. You can still
          connect <strong>BLE</strong> sensors.
        </p>
      )}
    </div>
  );
}
