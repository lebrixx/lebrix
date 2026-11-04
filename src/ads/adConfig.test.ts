import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { AD_IDS, AD_MODE, IS_AD_TEST_MODE } from './adConfig';

describe('live AdMob configuration', () => {
  it('uses real ads without test initialization', () => {
    expect(AD_MODE).toBe('production');
    expect(IS_AD_TEST_MODE).toBe(false);
  });

  it('uses the existing live interstitial and rewarded units', () => {
    expect(AD_IDS.interstitial).toBe('ca-app-pub-6790106624716732/9034600143');
    expect(AD_IDS.rewarded).toBe('ca-app-pub-6790106624716732/4113445950');
  });

  it('matches the native iOS application identifier', () => {
    const plist = readFileSync(new URL('../../ios/App/App/Info.plist', import.meta.url), 'utf8');
    const appId = plist.match(/<key>GADApplicationIdentifier<\/key>\s*<string>([^<]+)<\/string>/)?.[1];
    expect(appId).toBe(AD_IDS.appIdIos);
    expect(appId).toBe('ca-app-pub-6790106624716732~9273155360');
  });
});