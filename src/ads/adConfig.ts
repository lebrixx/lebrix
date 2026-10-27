// Configuration centralisée des identifiants AdMob.
// ⚠️ MODE TEST TEMPORAIRE : passer AD_MODE à 'production' pour restaurer les vraies annonces
// (et remettre l'ID de production dans ios/App/App/Info.plist → GADApplicationIdentifier).

export type AdMode = 'test' | 'production';

export const AD_MODE: AdMode = 'test';

// Identifiants de PRODUCTION (conservés, non utilisés en mode test)
const PRODUCTION_IDS = {
  appIdIos: 'ca-app-pub-6790106624716732~9273155360',
  interstitial: 'ca-app-pub-6790106624716732/9034600143',
  rewarded: 'ca-app-pub-6790106624716732/4113445950',
};

// Identifiants de TEST officiels Google (iOS)
const TEST_IDS = {
  appIdIos: 'ca-app-pub-3940256099942544~1458002511',
  interstitial: 'ca-app-pub-3940256099942544/4411468910',
  rewarded: 'ca-app-pub-3940256099942544/1712485313',
};

export const AD_IDS = AD_MODE === 'test' ? TEST_IDS : PRODUCTION_IDS;
export const IS_AD_TEST_MODE = AD_MODE === 'test';
