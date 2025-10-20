import { AdMob, RewardAdOptions, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { Interstitials } from '@/ads/InterstitialService';

const REWARDED_AD_UNIT_ID = 'ca-app-pub-6790106624716732/4113445950';
const COOLDOWN_MS = 60000; // 60 secondes entre chaque rewarded

export type RewardKind = 'revive' | 'boost1' | 'boost2' | 'boost3' | 'coins80' | 'ticket';

type FSMState = 'idle' | 'loading' | 'ready' | 'showing' | 'cooldown';

export interface RewardedResult {
  status: 'rewarded' | 'closed' | 'failed';
  ms?: number;
  kind?: RewardKind;
}

class RewardedService {
  private state: FSMState = 'idle';
  private inFlight = false;
  private lastShown = 0;
  private earned = false;
  private showStartTime = 0;
  private listeners: any[] = [];
  private retryTimeout: NodeJS.Timeout | null = null;
  private retryCount = 0;
private cooldownTimeout: NodeJS.Timeout | null = null;
private preloaded = false; // ad prepared in cache
private currentKind: RewardKind | null = null;

  async init(): Promise<void> {
    if (this.state !== 'idle') {
      console.log('[Rewarded] Already initialized, state:', this.state);
      return;
    }

    try {
      await AdMob.initialize({
        initializeForTesting: false, // Mode production
      });

      console.log('[Rewarded] AdMob initialized successfully (production mode)');
      this.state = 'loading';
      this.preload();
    } catch (error) {
      console.error('[Rewarded] AdMob initialization failed:', error);
      this.state = 'idle';
    }
  }

private async preload(): Promise<void> {
  // Avoid overlapping
  if (this.inFlight || this.state === 'showing') {
    console.log('[Rewarded] Preload skipped, state:', this.state, 'inFlight:', this.inFlight);
    return;
  }

  const wasCooldown = this.state === 'cooldown';
  if (!wasCooldown) {
    this.state = 'loading';
  }
  console.log('[Rewarded] Starting preload...');

  try {
    const options: RewardAdOptions = { adId: REWARDED_AD_UNIT_ID };
    await AdMob.prepareRewardVideoAd(options);
    this.preloaded = true;
    this.retryCount = 0;
    // Keep visual FSM in cooldown if we are cooling down, otherwise mark ready
    if (!wasCooldown) {
      this.state = 'ready';
    }
    console.log('[Rewarded] Ad preloaded successfully', { state: this.state, preloaded: this.preloaded });
  } catch (error) {
    console.error('[Rewarded] Failed to preload ad:', error);
    this.preloaded = false;
    if (!wasCooldown) {
      this.state = 'idle';
    }
    // Retry avec backoff exponentiel: 1s, 2s, 4s, 8s, max 30s
    const backoff = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
    this.retryCount++;
    console.log(`[Rewarded] Retrying preload in ${backoff}ms (attempt ${this.retryCount})`);
    if (this.retryTimeout) clearTimeout(this.retryTimeout);
    this.retryTimeout = setTimeout(() => {
      this.preload();
    }, backoff);
  }
}

isReady(): boolean {
  const now = Date.now();
  const cooldownPassed = now - this.lastShown >= COOLDOWN_MS;
  const ready = this.preloaded && !this.inFlight && cooldownPassed;

  if (!ready) {
    console.log('[Rewarded] Not ready:', {
      state: this.state,
      inFlight: this.inFlight,
      preloaded: this.preloaded,
      cooldownRemaining: Math.max(0, COOLDOWN_MS - (now - this.lastShown)),
    });
  }

  return ready;
}

  getCooldownRemaining(): number {
    const now = Date.now();
    const elapsed = now - this.lastShown;
    if (elapsed >= COOLDOWN_MS) return 0;
    return Math.ceil((COOLDOWN_MS - elapsed) / 1000);
  }

  async show(kind: RewardKind): Promise<RewardedResult> {
    // Vérifications de base
    if (this.inFlight) {
      console.warn('[Rewarded] blocked: already showing an ad');
      return { status: 'failed', kind };
    }

    if (!this.isReady()) {
      const cooldown = this.getCooldownRemaining();
      if (cooldown > 0) {
        console.warn(`[Rewarded] blocked: cooldown (${cooldown}s remaining)`);
      } else {
        console.warn(`[Rewarded] blocked: state=${this.state}`);
      }
      return { status: 'failed', kind };
    }

// Verrouiller
this.inFlight = true;
this.earned = false;
this.state = 'showing';
this.showStartTime = Date.now();
this.currentKind = kind;

// Inform interstitial scheduler to avoid chaining ads
try { Interstitials.notifyRewardedShown(); } catch {}

// Ensure ad overlays the status bar on iOS to avoid touch issues
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
}

console.log(`[Rewarded] Showing ad for kind: ${kind}`);


    return new Promise(async (resolve) => {
      let resolved = false;
      let safetyTimeout: NodeJS.Timeout;

      const cleanup = (result: RewardedResult) => {
        if (resolved) return;
        resolved = true;

        if (safetyTimeout) clearTimeout(safetyTimeout);
        this.removeListeners();

        const ms = Date.now() - this.showStartTime;
        const finalResult = { ...result, ms, kind };

        console.log('[Rewarded] Result:', finalResult);

        // Mettre à jour l'état
        this.inFlight = false;
        this.lastShown = Date.now();

        if (finalResult.status === 'rewarded' || finalResult.status === 'closed') {
// Entrer en cooldown
this.state = 'cooldown';

// Préparer la prochaine pub dès maintenant (cache), sans sortir du cooldown
this.preload();

if (this.cooldownTimeout) clearTimeout(this.cooldownTimeout);
this.cooldownTimeout = setTimeout(() => {
  console.log('[Rewarded] Cooldown finished');
  // À la fin du cooldown, si une pub est déjà préchargée, passer en ready
  this.state = this.preloaded ? 'ready' : 'idle';
  if (!this.preloaded) {
    // tenter un preload si pas déjà fait
    this.preload();
  }
}, COOLDOWN_MS);
        } else {
          // Échec, retenter de précharger immédiatement
          this.state = 'idle';
          setTimeout(() => this.preload(), 1000);
        }

        // Reset current kind for next run
        this.currentKind = null;

        resolve(finalResult);
      };

// Timeout de sécurité de 60 secondes
safetyTimeout = setTimeout(() => {
  console.warn('[Rewarded] Safety timeout reached (60s)');
  cleanup({ status: this.earned ? 'rewarded' : 'closed' });
}, 60000);

      // Configurer les listeners
      await this.setupListeners(cleanup);

      // Afficher la pub
      try {
        await AdMob.showRewardVideoAd();
        console.log('[Rewarded] showRewardVideoAd() called successfully');
      } catch (error) {
        console.error('[Rewarded] Failed to show ad:', error);
        cleanup({ status: 'failed' });
      }
    });
  }

  private async setupListeners(onComplete: (result: RewardedResult) => void): Promise<void> {
    try {
      let dismissedReceived = false;
      let shownReceived = false;
      let dismissTimeout: NodeJS.Timeout | null = null;
      let postRewardTimeout: NodeJS.Timeout | null = null;
      const startTime = Date.now();
      let shownAt = startTime;

      // Ad showed
      const showedHandle = await AdMob.addListener(RewardAdPluginEvents.Showed, () => {
        shownReceived = true;
        shownAt = Date.now();
        console.log(`👀 [${shownAt - startTime}ms] Ad showed`);
      });
      this.listeners.push(showedHandle);

      // User earned reward
      const rewardedHandle = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: any) => {
        const elapsed = Date.now() - startTime;
        console.log(`🎁 [${elapsed}ms] Reward earned:`, reward);
        this.earned = true;

        if (dismissedReceived) {
          if (postRewardTimeout) clearTimeout(postRewardTimeout);
          console.log('✅ Dismiss already received -> resolving rewarded now');
          onComplete({ status: 'rewarded' });
        } else {
          console.log('✅ Reward earned - waiting for dismiss');
          // Fallback if Dismissed never arrives on iOS for some creatives
          if (postRewardTimeout) clearTimeout(postRewardTimeout);
          postRewardTimeout = setTimeout(() => {
            console.warn('⌛ Reward earned but no Dismissed -> forcing resolve');
            onComplete({ status: 'rewarded' });
          }, 12000);
        }
      });
      this.listeners.push(rewardedHandle);

      // Ad dismissed
      const dismissedHandle = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        const elapsed = Date.now() - startTime;
        dismissedReceived = true;
        console.log(`👋 [${elapsed}ms] Ad dismissed, earned=${this.earned}, shown=${shownReceived}`);

        // Restore StatusBar overlay behavior
        if (Capacitor.isNativePlatform()) {
          StatusBar.setOverlaysWebView({ overlay: false }).catch(err => 
            console.log('[Rewarded] StatusBar reset error (ignored):', err)
          );
        }

        if (postRewardTimeout) clearTimeout(postRewardTimeout);

        if (this.earned) {
          if (dismissTimeout) clearTimeout(dismissTimeout);
          onComplete({ status: 'rewarded' });
        } else {
          // If dismissed too fast or before 'Showed', treat as failure
          if (!shownReceived || (Date.now() - shownAt) < 800) {
            console.warn('⚠️ Dismissed before shown or too fast, treating as failed');
            onComplete({ status: 'failed' });
            return;
          }
          if (dismissTimeout) clearTimeout(dismissTimeout);
          // Grace window for delayed reward callback (App Store sheet step)
          dismissTimeout = setTimeout(() => {
            const finalElapsed = Date.now() - startTime;
            console.log(`⏳ [${finalElapsed}ms] Grace period over. earned=${this.earned}`);
            onComplete({ status: this.earned ? 'rewarded' : 'closed' });
          }, 5000);
        }
      });
      this.listeners.push(dismissedHandle);

      // Error events
      const failedToLoadHandle = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
        console.error('💥 Ad failed to load:', error);
        if (dismissTimeout) clearTimeout(dismissTimeout);
        if (postRewardTimeout) clearTimeout(postRewardTimeout);
        onComplete({ status: 'failed' });
      });
      this.listeners.push(failedToLoadHandle);

      const failedToShowHandle = await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
        console.error('💥 Ad failed to show:', error);
        if (dismissTimeout) clearTimeout(dismissTimeout);
        if (postRewardTimeout) clearTimeout(postRewardTimeout);
        onComplete({ status: 'failed' });
      });
      this.listeners.push(failedToShowHandle);

      console.log('✅ Listeners setup complete');
    } catch (error) {
      console.error('💥 Error setting up listeners:', error);
      onComplete({ status: 'failed' });
    }
  }

  private removeListeners(): void {
    try {
      this.listeners.forEach(handle => {
        if (handle && handle.remove) {
          handle.remove();
        }
      });
      this.listeners = [];
      console.log('[Rewarded] Listeners removed');
    } catch (error) {
      console.error('[Rewarded] Error removing listeners:', error);
      this.listeners = [];
    }
  }

  // Méthode pour déboguer l'état actuel
  getState(): { state: FSMState; inFlight: boolean; cooldownRemaining: number } {
    return {
      state: this.state,
      inFlight: this.inFlight,
      cooldownRemaining: this.getCooldownRemaining(),
    };
  }
}

export const Rewarded = new RewardedService();
