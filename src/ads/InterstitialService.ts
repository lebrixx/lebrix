import { AdMob, InterstitialAdPluginEvents, AdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-6790106624716732/9034600143';
const INITIAL_DELAY_MS = 300000; // 5 minutes minimum après lancement de l'app
const INTERSTITIAL_COOLDOWN_MS = 420000; // 7 minutes entre chaque interstitielle
const REWARDED_INTERSTITIAL_GAP_MS = 90000; // 90 secondes après une rewarded avant interstitielle
const MAX_INTERSTITIALS_PER_SESSION = 3;

class InterstitialService {
  private isInitialized = false;
  private appLaunchTime = Date.now();
  private interstitialAdLoaded = false;
  private isInterstitialLoading = false;
  private lastInterstitialShown = 0;
  private interstitialsShownThisSession = 0;
  private interstitialListeners: any[] = [];
  private lastRewardedShown = 0; // Pour respecter le gap avec les rewarded

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await AdMob.initialize({
        initializeForTesting: false,
      });

      this.isInitialized = true;
      console.log('[Interstitial] AdMob initialized successfully');
      
      this.preloadInterstitial();
    } catch (error) {
      console.error('[Interstitial] AdMob initialization failed:', error);
    }
  }

  async preloadInterstitial(): Promise<void> {
    if (!this.isInitialized || this.isInterstitialLoading || this.interstitialAdLoaded) return;

    this.isInterstitialLoading = true;

    try {
      const options: AdOptions = {
        adId: INTERSTITIAL_AD_UNIT_ID,
      };

      await AdMob.prepareInterstitial(options);
      this.interstitialAdLoaded = true;
      console.log('[Interstitial] Ad preloaded successfully');
    } catch (error) {
      console.error('[Interstitial] Failed to preload ad:', error);
      this.interstitialAdLoaded = false;
    } finally {
      this.isInterstitialLoading = false;
    }
  }

  isInterstitialReady(): boolean {
    const now = Date.now();
    
    const appRunningTimeCheck = now - this.appLaunchTime >= INITIAL_DELAY_MS;
    const interstitialCooldownPassed = now - this.lastInterstitialShown >= INTERSTITIAL_COOLDOWN_MS;
    const noRecentRewarded = now - this.lastRewardedShown >= REWARDED_INTERSTITIAL_GAP_MS;
    const underSessionLimit = this.interstitialsShownThisSession < MAX_INTERSTITIALS_PER_SESSION;
    
    return this.interstitialAdLoaded 
      && appRunningTimeCheck
      && interstitialCooldownPassed 
      && noRecentRewarded 
      && underSessionLimit 
      && this.isInitialized;
  }

  notifyRewardedShown(): void {
    this.lastRewardedShown = Date.now();
  }

  async showInterstitialIfReady(): Promise<boolean> {
    if (!this.isInterstitialReady()) {
      console.log('[Interstitial] Not ready:', {
        isLoaded: this.interstitialAdLoaded,
        cooldownPassed: Date.now() - this.lastInterstitialShown >= INTERSTITIAL_COOLDOWN_MS,
        noRecentRewarded: Date.now() - this.lastRewardedShown >= REWARDED_INTERSTITIAL_GAP_MS,
        sessionCount: this.interstitialsShownThisSession,
      });
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    return new Promise(async (resolve) => {
      let dismissed = false;
      let timeoutId: NodeJS.Timeout;

      const restoreScreen = async () => {
        // Toujours restaurer l'écran après une pub interstitielle
        if (Capacitor.isNativePlatform()) {
          try {
            await StatusBar.setOverlaysWebView({ overlay: false });
            await StatusBar.show();
            console.log('[Interstitial] Screen restored successfully');
          } catch (err) {
            console.log('[Interstitial] StatusBar restore error (ignored):', err);
          }
        }
      };

      const cleanup = async () => {
        if (timeoutId) clearTimeout(timeoutId);
        this.removeInterstitialListeners();
        this.lastInterstitialShown = Date.now();
        this.interstitialsShownThisSession++;
        this.interstitialAdLoaded = false;
        
        // Restaurer l'écran
        await restoreScreen();
        
        setTimeout(() => this.preloadInterstitial(), 2000);
      };

      const finalize = async (success: boolean) => {
        if (!dismissed) {
          dismissed = true;
          await cleanup();
          console.log(`[Interstitial] ${success ? 'completed' : 'failed/dismissed'}`);
          resolve(success);
        }
      };

      timeoutId = setTimeout(async () => {
        console.warn('[Interstitial] timeout - forcing cleanup');
        await finalize(false);
      }, 30000);

      await this.setupInterstitialListeners(
        () => finalize(true), 
        () => finalize(false)
      );

      try {
        await AdMob.showInterstitial();
        console.log('[Interstitial] displayed successfully');
      } catch (error) {
        console.error('[Interstitial] Failed to show:', error);
        await finalize(false);
      }
    });
  }

  private async setupInterstitialListeners(onSuccess: () => void, onFailure: () => void): Promise<void> {
    try {
      const dismissedHandle = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        console.log('[Interstitial] dismissed');
        onSuccess();
      });
      this.interstitialListeners.push(dismissedHandle);

      const failedToLoadHandle = await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: any) => {
        console.error('[Interstitial] failed to load:', error);
        onFailure();
      });
      this.interstitialListeners.push(failedToLoadHandle);

      const failedToShowHandle = await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error: any) => {
        console.error('[Interstitial] failed to show:', error);
        onFailure();
      });
      this.interstitialListeners.push(failedToShowHandle);

      console.log('[Interstitial] Listeners setup complete');
    } catch (error) {
      console.error('[Interstitial] Error setting up listeners:', error);
      onFailure();
    }
  }

  private removeInterstitialListeners(): void {
    try {
      this.interstitialListeners.forEach(handle => {
        if (handle && handle.remove) {
          handle.remove();
        }
      });
      this.interstitialListeners = [];
      console.log('[Interstitial] Listeners removed');
    } catch (error) {
      console.error('[Interstitial] Error removing listeners:', error);
      this.interstitialListeners = [];
    }
  }
}

export const Interstitials = new InterstitialService();
