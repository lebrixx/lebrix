// Gestion de l'identité locale sans authentification
const DEVICE_ID_KEY = 'circle_tap_device_id';
const USERNAME_KEY = 'circle_tap_username';

export interface LocalIdentity {
  deviceId: string;
  username: string | null;
}

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function setUsername(username: string): void {
  if (!isValidUsername(username)) {
    throw new Error('Pseudo invalide. Doit contenir entre 3 et 16 caractères alphanumériques ou underscore.');
  }
  localStorage.setItem(USERNAME_KEY, username);
}

export function getLocalIdentity(): LocalIdentity {
  return {
    deviceId: getDeviceId(),
    username: getUsername()
  };
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,16}$/.test(username);
}

export function generateDefaultUsername(): string {
  return `Player${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
}