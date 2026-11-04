// Configuration centralisée des identifiants AdMob.
// L'ID dans ios/App/App/Info.plist → GADApplicationIdentifier doit correspondre au mode choisi.

export type AdMode = 'test' | 'production';

export const AD_MODE: AdMode = 'production';

// Identifiants de PRODUCTION
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

function isTestMode(mode: AdMode): boolean {
  return mode === 'test';
}

export const IS_AD_TEST_MODE = isTestMode(AD_MODE);
export const AD_IDS = IS_AD_TEST_MODE ? TEST_IDS : PRODUCTION_IDS;
