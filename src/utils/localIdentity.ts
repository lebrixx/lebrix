// Gestion de l'identité locale sans authentification
const DEVICE_ID_KEY = 'circle_tap_device_id';
const USERNAME_KEY = 'circle_tap_username';
const USERNAME_CHANGES_KEY = 'circle_tap_username_changes';
const MAX_USERNAME_CHANGES = 1;

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

export function getUsernameChangesCount(): number {
  const count = localStorage.getItem(USERNAME_CHANGES_KEY);
  return count ? parseInt(count, 10) : 0;
}

export function getRemainingUsernameChanges(): number {
  const currentUsername = getUsername();
  // Si pas encore de pseudo, les changements ne comptent pas encore
  if (!currentUsername) {
    return MAX_USERNAME_CHANGES;
  }
  return Math.max(0, MAX_USERNAME_CHANGES - getUsernameChangesCount());
}

export function canChangeUsername(): boolean {
  const currentUsername = getUsername();
  // Premier pseudo = toujours autorisé
  if (!currentUsername) {
    return true;
  }
  return getRemainingUsernameChanges() > 0;
}

export function setUsername(username: string): void {
  if (!isValidUsername(username)) {
    throw new Error('Pseudo invalide. Doit contenir entre 3 et 16 caractères alphanumériques, points, tirets ou underscores.');
  }
  
  const currentUsername = getUsername();
  
  // Si c'est un changement (pas le premier pseudo), incrémenter le compteur
  if (currentUsername && currentUsername !== username) {
    if (!canChangeUsername()) {
      throw new Error('LIMIT_REACHED');
    }
    const currentChanges = getUsernameChangesCount();
    localStorage.setItem(USERNAME_CHANGES_KEY, (currentChanges + 1).toString());
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
  return /^[a-zA-Z0-9._-]{3,16}$/.test(username);
}

export function generateDefaultUsername(): string {
  return `Player${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
}