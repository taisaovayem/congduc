const DEVICE_ID_KEY = 'congduc_device_id';

export function getStoredDeviceId(): string | null {
  return localStorage.getItem(DEVICE_ID_KEY);
}

export function setStoredDeviceId(deviceId: string): void {
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
}
