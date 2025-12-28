import { AdMob, InterstitialAdPluginEvents, AdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-6790106624716732/9034600143';
const INITIAL_DELAY_MS = 360000; // 6 minutes minimum après lancement
const INTERSTITIAL_COOLDOWN_MS = 420000; // 7 minutes entre chaque interstitielle
const REWARDED_INTERSTITIAL_GAP_MS = 90000; // 90 secondes après une rewarded
const MAX_INTERSTITIALS_PER_SESSION = 3;

class InterstitialService {
  private isInitialized = false;
  private appLaunchTime = Date.now();
  private interstitialAdLoaded = false;
  private isInterstitialLoading = false;
  private lastInterstitialShown = 0;
  private interstitialsShownThisSession = 0;
  private interstitialListeners: any[] = [];
  private lastRewardedShown = 0;

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

    return new Promise(async (resolve) => {
      let isFinalized = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const restoreScreen = async () => {
        if (Capacitor.isNativePlatform()) {
          try {
            // Remettre l'overlay comme au démarrage pour éviter le "shift" de safe area après une pub
            await StatusBar.setOverlaysWebView({ overlay: false });
            await StatusBar.show();

            // Forcer le recalcul layout côté WebView
            requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));

            document.body.focus();
            window.focus();

            console.log('[Interstitial] Screen restored (overlay=false)');
          } catch (err) {
            console.log('[Interstitial] StatusBar restore error:', err);
          }
        }
      };

      const finalize = async (success: boolean) => {
        // Empêcher les appels multiples
        if (isFinalized) {
          console.log('[Interstitial] Already finalized, skipping');
          return;
        }
        isFinalized = true;

        // Nettoyer le timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        // Nettoyer les listeners
        this.removeInterstitialListeners();

        // Mettre à jour les compteurs
        this.lastInterstitialShown = Date.now();
        this.interstitialsShownThisSession++;
        this.interstitialAdLoaded = false;

        // Restaurer l'écran avec délai pour laisser l'ad se fermer proprement
        await new Promise(r => setTimeout(r, 300));
        await restoreScreen();

        // Double restauration après 500ms pour sécurité
        setTimeout(restoreScreen, 500);

        // Précharger la prochaine pub
        setTimeout(() => this.preloadInterstitial(), 3000);

        console.log(`[Interstitial] Finalized with success: ${success}`);
        resolve(success);
      };

      // Setup listeners AVANT de montrer l'ad
      try {
        const dismissedHandle = await AdMob.addListener(
          InterstitialAdPluginEvents.Dismissed,
          async () => {
            console.log('[Interstitial] User dismissed ad');
            // Attendre pour laisser l'animation de fermeture se terminer
            await new Promise(r => setTimeout(r, 200));
            await finalize(true);
          }
        );
        this.interstitialListeners.push(dismissedHandle);

        const failedToLoadHandle = await AdMob.addListener(
          InterstitialAdPluginEvents.FailedToLoad,
          async (error: any) => {
            console.error('[Interstitial] Failed to load:', error);
            await finalize(false);
          }
        );
        this.interstitialListeners.push(failedToLoadHandle);

        const failedToShowHandle = await AdMob.addListener(
          InterstitialAdPluginEvents.FailedToShow,
          async (error: any) => {
            console.error('[Interstitial] Failed to show:', error);
            await finalize(false);
          }
        );
        this.interstitialListeners.push(failedToShowHandle);

        console.log('[Interstitial] Listeners ready');
      } catch (error) {
        console.error('[Interstitial] Error setting up listeners:', error);
        resolve(false);
        return;
      }

      // Timeout de sécurité (30s pour laisser le temps de regarder)
      timeoutId = setTimeout(async () => {
        console.warn('[Interstitial] Safety timeout triggered');
        await finalize(false);
      }, 30000);

      // Maintenant montrer l'ad
      try {
        console.log('[Interstitial] Showing ad...');
        await AdMob.showInterstitial();
        console.log('[Interstitial] Ad displayed successfully');
      } catch (error) {
        console.error('[Interstitial] Failed to show:', error);
        await finalize(false);
      }
    });
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
