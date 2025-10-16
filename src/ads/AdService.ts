import { AdMob, RewardAdOptions, AdLoadInfo, AdMobRewardItem, RewardAdPluginEvents } from '@capacitor-community/admob';

const REWARDED_AD_UNIT_ID = 'ca-app-pub-6790106624716732/4113445950';
const COOLDOWN_MS = 60000; // 60 secondes entre chaque pub

class AdService {
  private isInitialized = false;
  private isAdReady = false;
  private isAdLoading = false;
  private lastAdShown = 0;
  private rewardCallback: ((success: boolean) => void) | null = null;
  private listeners: any[] = [];

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await AdMob.initialize({
        initializeForTesting: true, // Changer à false avant publication
      });

      this.isInitialized = true;
      console.log('AdMob initialized successfully');
      
      // Précharger la première pub
      this.preloadRewarded();
    } catch (error) {
      console.error('AdMob initialization failed:', error);
      // Ne pas crasher l'app si AdMob échoue
    }
  }

  async preloadRewarded(): Promise<void> {
    if (!this.isInitialized || this.isAdLoading || this.isAdReady) return;

    this.isAdLoading = true;

    try {
      const options: RewardAdOptions = {
        adId: REWARDED_AD_UNIT_ID,
      };

      await AdMob.prepareRewardVideoAd(options);
      this.isAdReady = true;
      console.log('Rewarded ad preloaded successfully');
    } catch (error) {
      console.error('Failed to preload rewarded ad:', error);
      this.isAdReady = false;
    } finally {
      this.isAdLoading = false;
    }
  }

  isReady(): boolean {
    const now = Date.now();
    const cooldownPassed = now - this.lastAdShown >= COOLDOWN_MS;
    return this.isAdReady && cooldownPassed && this.isInitialized;
  }

  getCooldownRemaining(): number {
    const now = Date.now();
    const elapsed = now - this.lastAdShown;
    if (elapsed >= COOLDOWN_MS) return 0;
    return Math.ceil((COOLDOWN_MS - elapsed) / 1000);
  }

  async showRewarded(kind: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('Ad not ready or in cooldown');
      return false;
    }

    return new Promise((resolve) => {
      this.rewardCallback = (success: boolean) => {
        this.lastAdShown = Date.now();
        this.isAdReady = false;
        
        // Nettoyer les listeners
        this.removeListeners();
        
        // Précharger la prochaine pub
        setTimeout(() => this.preloadRewarded(), 1000);
        
        resolve(success);
      };

      this.setupAdListeners();
      this.showAd();
    });
  }

  private setupAdListeners(): void {
    // Écouter la récompense
    AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
      console.log('Ad reward received:', reward);
      if (this.rewardCallback) {
        this.rewardCallback(true);
        this.rewardCallback = null;
      }
    }).then(handle => this.listeners.push(handle));

    // Écouter la fermeture de la pub
    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      console.log('Ad dismissed');
      if (this.rewardCallback) {
        // Pub fermée sans récompense
        this.rewardCallback(false);
        this.rewardCallback = null;
      }
    }).then(handle => this.listeners.push(handle));

    // Écouter les erreurs de chargement
    AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
      console.error('Ad failed to load:', error);
      if (this.rewardCallback) {
        this.rewardCallback(false);
        this.rewardCallback = null;
      }
    }).then(handle => this.listeners.push(handle));

    // Écouter les erreurs d'affichage
    AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
      console.error('Ad failed to show:', error);
      if (this.rewardCallback) {
        this.rewardCallback(false);
        this.rewardCallback = null;
      }
    }).then(handle => this.listeners.push(handle));
  }

  private removeListeners(): void {
    this.listeners.forEach(handle => handle.remove());
    this.listeners = [];
  }

  private async showAd(): Promise<void> {
    try {
      await AdMob.showRewardVideoAd();
    } catch (error) {
      console.error('Failed to show ad:', error);
      if (this.rewardCallback) {
        this.rewardCallback(false);
        this.rewardCallback = null;
      }
    }
  }
}

export const Ads = new AdService();
