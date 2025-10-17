import { AdMob, RewardAdOptions, InterstitialAdPluginEvents, AdOptions, RewardAdPluginEvents } from '@capacitor-community/admob';

const REWARDED_AD_UNIT_ID = 'ca-app-pub-6790106624716732/4113445950';
const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-6790106624716732/9034600143';
const REWARDED_COOLDOWN_MS = 60000; // 60 secondes entre chaque rewarded
const INTERSTITIAL_COOLDOWN_MS = 420000; // 7 minutes entre chaque interstitielle
const REWARDED_INTERSTITIAL_GAP_MS = 90000; // 90 secondes après une rewarded avant interstitielle
const MAX_INTERSTITIALS_PER_SESSION = 3;

class AdService {
  private isInitialized = false;
  private appLaunchTime = Date.now(); // Timestamp du lancement de l'app
  
  // Rewarded ads
  private rewardedAdLoaded = false;
  private isRewardedLoading = false;
  private lastRewardedShown = 0;
  private rewardCallback: ((success: boolean) => void) | null = null;
  private rewardedListeners: any[] = [];
  
  // Interstitial ads
  private interstitialAdLoaded = false;
  private isInterstitialLoading = false;
  private lastInterstitialShown = 0;
  private interstitialsShownThisSession = 0;
  private interstitialListeners: any[] = [];

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await AdMob.initialize({
        initializeForTesting: false, // Mode production pour l'App Store
      });

      this.isInitialized = true;
      console.log('AdMob initialized successfully (production mode)');
      
      // Précharger la première pub rewarded
      this.preloadRewarded();
      
      // Précharger la première interstitielle
      this.preloadInterstitial();
    } catch (error) {
      console.error('AdMob initialization failed:', error);
      // Ne pas crasher l'app si AdMob échoue
    }
  }

  async preloadRewarded(): Promise<void> {
    if (!this.isInitialized || this.isRewardedLoading || this.rewardedAdLoaded) return;

    this.isRewardedLoading = true;

    try {
      const options: RewardAdOptions = {
        adId: REWARDED_AD_UNIT_ID,
      };

      await AdMob.prepareRewardVideoAd(options);
      this.rewardedAdLoaded = true;
      console.log('Rewarded ad preloaded successfully');
    } catch (error) {
      console.error('Failed to preload rewarded ad:', error);
      this.rewardedAdLoaded = false;
    } finally {
      this.isRewardedLoading = false;
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
      console.log('Interstitial ad preloaded successfully');
    } catch (error) {
      console.error('Failed to preload interstitial ad:', error);
      this.interstitialAdLoaded = false;
    } finally {
      this.isInterstitialLoading = false;
    }
  }

  isReady(): boolean {
    const now = Date.now();
    const cooldownPassed = now - this.lastRewardedShown >= REWARDED_COOLDOWN_MS;
    return this.rewardedAdLoaded && cooldownPassed && this.isInitialized;
  }

  getCooldownRemaining(): number {
    const now = Date.now();
    const elapsed = now - this.lastRewardedShown;
    if (elapsed >= REWARDED_COOLDOWN_MS) return 0;
    return Math.ceil((REWARDED_COOLDOWN_MS - elapsed) / 1000);
  }

  isInterstitialReady(): boolean {
    const now = Date.now();
    
    // Vérifier que 6 minutes se sont écoulées depuis le lancement de l'app
    const appRunningTimeCheck = now - this.appLaunchTime >= 360000; // 6 minutes
    
    // Vérifier le cooldown de 7 minutes entre interstitielles
    const interstitialCooldownPassed = now - this.lastInterstitialShown >= INTERSTITIAL_COOLDOWN_MS;
    
    // Vérifier qu'aucune rewarded n'a été vue dans les 90 dernières secondes
    const noRecentRewarded = now - this.lastRewardedShown >= REWARDED_INTERSTITIAL_GAP_MS;
    
    // Vérifier la limite de 3 pubs par session
    const underSessionLimit = this.interstitialsShownThisSession < MAX_INTERSTITIALS_PER_SESSION;
    
    return this.interstitialAdLoaded 
      && appRunningTimeCheck
      && interstitialCooldownPassed 
      && noRecentRewarded 
      && underSessionLimit 
      && this.isInitialized;
  }

  async showRewarded(kind: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('Rewarded ad not ready or in cooldown');
      return false;
    }

    return new Promise(async (resolve) => {
      let timeoutId: NodeJS.Timeout;
      let rewardReceived = false;

      this.rewardCallback = (success: boolean) => {
        if (timeoutId) clearTimeout(timeoutId);
        this.lastRewardedShown = Date.now();
        this.rewardedAdLoaded = false;
        
        console.log(`Rewarded ad callback called with success: ${success}`);
        
        // Nettoyer les listeners
        this.removeRewardedListeners();
        
        // Précharger la prochaine pub
        setTimeout(() => this.preloadRewarded(), 1000);
        
        resolve(success);
      };

      // Timeout de sécurité de 30 secondes
      timeoutId = setTimeout(() => {
        console.warn('Rewarded ad timeout - forcing cleanup');
        if (this.rewardCallback) {
          const callback = this.rewardCallback;
          this.rewardCallback = null;
          callback(false);
        }
      }, 30000);

      await this.setupRewardedListeners();
      
      try {
        await this.showRewardedAd();
        console.log('Rewarded ad display initiated successfully');
      } catch (error) {
        console.error('Failed to initiate rewarded ad display:', error);
        if (this.rewardCallback) {
          const callback = this.rewardCallback;
          this.rewardCallback = null;
          callback(false);
        }
      }
    });
  }

  async showInterstitialIfReady(): Promise<boolean> {
    if (!this.isInterstitialReady()) {
      console.log('Interstitial not ready:', {
        isLoaded: this.interstitialAdLoaded,
        cooldownPassed: Date.now() - this.lastInterstitialShown >= INTERSTITIAL_COOLDOWN_MS,
        noRecentRewarded: Date.now() - this.lastRewardedShown >= REWARDED_INTERSTITIAL_GAP_MS,
        sessionCount: this.interstitialsShownThisSession,
      });
      return false;
    }

    // Délai de 1 seconde avant affichage
    await new Promise(resolve => setTimeout(resolve, 1000));

    return new Promise(async (resolve) => {
      let dismissed = false;
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        this.removeInterstitialListeners();
        this.lastInterstitialShown = Date.now();
        this.interstitialsShownThisSession++;
        this.interstitialAdLoaded = false;
        
        // Précharger la prochaine interstitielle
        setTimeout(() => this.preloadInterstitial(), 2000);
      };

      const finalize = (success: boolean) => {
        if (!dismissed) {
          dismissed = true;
          cleanup();
          console.log(`Interstitial ${success ? 'completed' : 'failed/dismissed'}`);
          resolve(success);
        }
      };

      // Timeout de sécurité de 30 secondes
      timeoutId = setTimeout(() => {
        console.warn('Interstitial timeout - forcing cleanup');
        finalize(false);
      }, 30000);

      // Attendre que les listeners soient configurés AVANT d'afficher la pub
      await this.setupInterstitialListeners(
        () => finalize(true), 
        () => finalize(false)
      );

      // Afficher la pub seulement après que les listeners soient prêts
      try {
        await this.showInterstitialAd();
        console.log('Interstitial displayed successfully');
      } catch (error) {
        console.error('Failed to show interstitial:', error);
        finalize(false);
      }
    });
  }

  private async setupRewardedListeners(): Promise<void> {
    try {
      let rewardGranted = false;
      
      // Listener pour la récompense (doit arriver avant Dismissed)
      const rewardedHandle = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: any) => {
        console.log('🎁 Ad reward received:', reward);
        rewardGranted = true;
        if (this.rewardCallback) {
          console.log('✅ Calling reward callback with success=true');
          this.rewardCallback(true);
          this.rewardCallback = null;
        }
      });
      this.rewardedListeners.push(rewardedHandle);

      // Listener pour la fermeture (arrive après Rewarded si complété)
      const dismissedHandle = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        console.log('👋 Ad dismissed, rewardGranted:', rewardGranted);
        if (this.rewardCallback && !rewardGranted) {
          // Pub fermée avant la fin sans récompense
          console.log('❌ Calling reward callback with success=false (dismissed early)');
          this.rewardCallback(false);
          this.rewardCallback = null;
        }
      });
      this.rewardedListeners.push(dismissedHandle);

      const failedToLoadHandle = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
        console.error('💥 Ad failed to load:', error);
        if (this.rewardCallback) {
          this.rewardCallback(false);
          this.rewardCallback = null;
        }
      });
      this.rewardedListeners.push(failedToLoadHandle);

      const failedToShowHandle = await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
        console.error('💥 Ad failed to show:', error);
        if (this.rewardCallback) {
          this.rewardCallback(false);
          this.rewardCallback = null;
        }
      });
      this.rewardedListeners.push(failedToShowHandle);

      console.log('✅ Rewarded listeners setup complete (4 listeners)');
    } catch (error) {
      console.error('💥 Error setting up rewarded listeners:', error);
      if (this.rewardCallback) {
        this.rewardCallback(false);
        this.rewardCallback = null;
      }
    }
  }

  private async setupInterstitialListeners(onSuccess: () => void, onFailure: () => void): Promise<void> {
    try {
      // Ajouter tous les listeners et attendre qu'ils soient prêts
      const dismissedHandle = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        console.log('Interstitial dismissed');
        onSuccess();
      });
      this.interstitialListeners.push(dismissedHandle);

      const failedToLoadHandle = await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: any) => {
        console.error('Interstitial failed to load:', error);
        onFailure();
      });
      this.interstitialListeners.push(failedToLoadHandle);

      const failedToShowHandle = await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error: any) => {
        console.error('Interstitial failed to show:', error);
        onFailure();
      });
      this.interstitialListeners.push(failedToShowHandle);

      console.log('Interstitial listeners setup complete');
    } catch (error) {
      console.error('Error setting up interstitial listeners:', error);
      onFailure();
    }
  }

  private removeRewardedListeners(): void {
    try {
      this.rewardedListeners.forEach(handle => {
        if (handle && handle.remove) {
          handle.remove();
        }
      });
      this.rewardedListeners = [];
      console.log('Rewarded listeners removed');
    } catch (error) {
      console.error('Error removing rewarded listeners:', error);
      this.rewardedListeners = [];
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
      console.log('Interstitial listeners removed');
    } catch (error) {
      console.error('Error removing interstitial listeners:', error);
      this.interstitialListeners = [];
    }
  }

  private async showRewardedAd(): Promise<void> {
    try {
      await AdMob.showRewardVideoAd();
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      if (this.rewardCallback) {
        this.rewardCallback(false);
        this.rewardCallback = null;
      }
    }
  }

  private async showInterstitialAd(): Promise<void> {
    try {
      await AdMob.showInterstitial();
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
      throw error;
    }
  }
}

export const Ads = new AdService();
