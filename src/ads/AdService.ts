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
  private initPromise: Promise<void> | null = null;
  
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
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      try {
        await AdMob.initialize({
          initializeForTesting: false, // Mode production pour l'App Store
        });

        this.isInitialized = true;
        console.log('AdMob initialized successfully (production mode)');

        // Précharger les pubs (une seule fois après init)
        this.preloadRewarded();
        this.preloadInterstitial();
      } catch (error) {
        console.error('AdMob initialization failed:', error);
        // Ne pas crasher l'app si AdMob échoue
      }
    })();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
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

    return new Promise((resolve) => {
      this.rewardCallback = (success: boolean) => {
        this.lastRewardedShown = Date.now();
        this.rewardedAdLoaded = false;
        
        // Nettoyer les listeners
        this.removeRewardedListeners();
        
        // Précharger la prochaine pub
        setTimeout(() => this.preloadRewarded(), 1000);
        
        resolve(success);
      };

      this.setupRewardedListeners();
      this.showRewardedAd();
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

    return new Promise((resolve) => {
      let dismissed = false;

      const cleanup = () => {
        this.removeInterstitialListeners();
        this.lastInterstitialShown = Date.now();
        this.interstitialsShownThisSession++;
        this.interstitialAdLoaded = false;
        
        // Précharger la prochaine interstitielle
        setTimeout(() => this.preloadInterstitial(), 2000);
      };

      this.setupInterstitialListeners(() => {
        if (!dismissed) {
          dismissed = true;
          cleanup();
          resolve(true);
        }
      }, () => {
        if (!dismissed) {
          dismissed = true;
          cleanup();
          resolve(false);
        }
      });

      this.showInterstitialAd().catch(() => {
        if (!dismissed) {
          dismissed = true;
          cleanup();
          resolve(false);
        }
      });
    });
  }

  private setupRewardedListeners(): void {
    // Écouter la récompense
    AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: any) => {
      console.log('Ad reward received:', reward);
      if (this.rewardCallback) {
        this.rewardCallback(true);
        this.rewardCallback = null;
      }
    }).then(handle => this.rewardedListeners.push(handle));

    // Écouter la fermeture de la pub
    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      console.log('Ad dismissed');
      if (this.rewardCallback) {
        // Pub fermée sans récompense
        this.rewardCallback(false);
        this.rewardCallback = null;
      }
    }).then(handle => this.rewardedListeners.push(handle));

    // Écouter les erreurs de chargement
    AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
      console.error('Ad failed to load:', error);
      if (this.rewardCallback) {
        this.rewardCallback(false);
        this.rewardCallback = null;
      }
    }).then(handle => this.rewardedListeners.push(handle));

    // Écouter les erreurs d'affichage
    AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
      console.error('Ad failed to show:', error);
      if (this.rewardCallback) {
        this.rewardCallback(false);
        this.rewardCallback = null;
      }
    }).then(handle => this.rewardedListeners.push(handle));
  }

  private setupInterstitialListeners(onSuccess: () => void, onFailure: () => void): void {
    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      console.log('Interstitial dismissed');
      onSuccess();
    }).then(handle => this.interstitialListeners.push(handle));

    AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: any) => {
      console.error('Interstitial failed to load:', error);
      onFailure();
    }).then(handle => this.interstitialListeners.push(handle));

    AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error: any) => {
      console.error('Interstitial failed to show:', error);
      onFailure();
    }).then(handle => this.interstitialListeners.push(handle));
  }

  private removeRewardedListeners(): void {
    this.rewardedListeners.forEach(handle => handle.remove());
    this.rewardedListeners = [];
  }

  private removeInterstitialListeners(): void {
    this.interstitialListeners.forEach(handle => handle.remove());
    this.interstitialListeners = [];
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
