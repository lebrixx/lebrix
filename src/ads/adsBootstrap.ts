import { AdMob, AdmobConsentStatus } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { IS_AD_TEST_MODE } from './adConfig';

/**
 * Démarrage unique d'AdMob, dans l'ordre exigé par Google et Apple :
 * 1. initialisation du SDK,
 * 2. consentement RGPD (formulaire UMP de Google, affiché seulement si nécessaire : UE / Royaume-Uni…),
 * 3. demande de suivi publicitaire ATT d'Apple (iOS uniquement, une seule fois).
 * Les services de pub attendent cette promesse avant de charger la moindre annonce.
 * Le formulaire RGPD se configure dans la console AdMob → « Confidentialité et messages ».
 */
let ready: Promise<boolean> | null = null;

async function runConsentFlow(): Promise<void> {
  // Consentement RGPD (UMP). Si aucun message n'est configuré dans AdMob, le statut revient NOT_REQUIRED.
  try {
    const info = await AdMob.requestConsentInfo();
    if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm();
    }
  } catch (error) {
    console.warn('[Ads] Consent info unavailable:', error);
  }

  // App Tracking Transparency (iOS 14+) : l'invite système n'apparaît qu'une seule fois.
  if (Capacitor.getPlatform() === 'ios') {
    try {
      const { status } = await AdMob.trackingAuthorizationStatus();
      if (status === 'notDetermined') await AdMob.requestTrackingAuthorization();
    } catch (error) {
      console.warn('[Ads] Tracking authorization failed:', error);
    }
  }
}

export function ensureAdsReady(): Promise<boolean> {
  if (ready) return ready;
  ready = (async () => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      await AdMob.initialize({ initializeForTesting: IS_AD_TEST_MODE });
      console.log(`[AdMob] initialized in ${IS_AD_TEST_MODE ? 'TEST' : 'production'} mode`);
    } catch (error) {
      console.error('[AdMob] initialization failed:', error);
      ready = null; // nouvel essai possible plus tard
      return false;
    }
    await runConsentFlow();
    return true;
  })();
  return ready;
}

/** Les autres demandes d'autorisation (notifications) attendent la fin du parcours pub pour ne pas se superposer. */
export function whenAdsPromptsDone(): Promise<void> {
  return ensureAdsReady().then(() => undefined, () => undefined);
}
