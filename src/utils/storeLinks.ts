import { Capacitor } from '@capacitor/core';

/** Identifiants publics de Lucky Stop sur les stores. */
export const APP_STORE_ID = '6753086875';
export const ANDROID_PACKAGE = 'com.bryangouzou.luckystop';

export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

/** Lien à partager : la fiche du store de la plateforme du joueur (App Store par défaut). */
export function shareStoreUrl(): string {
  return Capacitor.getPlatform() === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
}
