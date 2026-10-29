import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ShoppingBag, Trophy, Star, Coins, Gamepad2, Crown, Gift, Languages, Sparkles, Settings as SettingsIcon, Instagram, RotateCcw, Backpack, Crosshair, Clock, Globe, Calendar, ChevronRight, Lightbulb, Lock, Plus, FileText, Tag, Box, Boxes } from 'lucide-react';
import { isBrixFactoryUnlocked } from '@/utils/pongUnlock';
import { useToast } from '@/hooks/use-toast';
import { fetchMonthlyGlobalLeaderboard, GlobalPlayerScore } from '@/utils/globalScoresApi';
import { getLocalIdentity } from '@/utils/localIdentity';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage, translations, Language } from '@/hooks/useLanguage';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Settings } from '@/components/Settings';
import { PremiumOffer } from '@/components/PremiumOffer';
import { LuckyWheel } from '@/components/LuckyWheel';
import { SeasonPass } from '@/components/SeasonPass';
import { Inventory } from '@/components/Inventory';
import { DailyTip } from '@/components/DailyTip';
import { MainMenuBackground } from '@/components/MainMenuBackground';
import luckyStopLogo from '@/assets/lucky-stop-logo.png';
import { hasDailyQuestReward, addDiamonds, getSeasonPassData, PASS_TIERS } from '@/utils/seasonPass';
import { useIsTablet } from '@/hooks/use-tablet';
import { Capacitor } from '@capacitor/core';
import { hasPendingChallengeRewards } from '@/utils/challengeUtils';
import { canSpinFree, getTimeUntilNextFreeSpin, formatTimeRemaining } from '@/utils/luckyWheel';
import { hasPlayedToday, getSecondsUntilNextChallenge, formatCountdown } from '@/utils/dailyChallenge';

interface MainMenuProps {
  bestScore: number;
  coins: number;
  theme: string;
  currentMode: string;
  onStartGame: () => void;
  onOpenShop: () => void;
  onOpenChallenges: () => void;
  onOpenModes: () => void;
  onOpenLeaderboard: () => void;
  onOpenDailyRewards: () => void;
  onOpenGlobalLeaderboard: () => void;
  hasAvailableReward: boolean;
  onAdRewardClaimed: (coins: number) => void;
  onSpendCoins?: (amount: number) => boolean;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
  onOpenRateDialog?: () => void;
  onOpenDailyChallenge?: () => void;
  onReplayOnboarding?: () => void;
  onOpenBrixFactory?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ 
  bestScore, 
  coins, 
  theme,
  currentMode,
  onStartGame, 
  onOpenShop, 
  onOpenChallenges,
  onOpenModes,
  onOpenLeaderboard,
  onOpenDailyRewards,
  onOpenGlobalLeaderboard,
  hasAvailableReward,
  onAdRewardClaimed,
  onSpendCoins,
  isSoundMuted = false,
  onToggleSound = () => {},
  onOpenRateDialog,
  onOpenDailyChallenge,
  onReplayOnboarding,
  onOpenBrixFactory
}) => {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSeasonPass, setShowSeasonPass] = useState(false);
  const [showPremiumOffer, setShowPremiumOffer] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showDailyTip, setShowDailyTip] = useState(false);
  const [hasPassReward, setHasPassReward] = useState(hasDailyQuestReward());
  const [hasPendingChallenges, setHasPendingChallenges] = useState(false);
  const [hasFreeSpin, setHasFreeSpin] = useState(canSpinFree());
  const [wheelTimer, setWheelTimer] = useState(formatTimeRemaining(getTimeUntilNextFreeSpin()));
  const [globalRank, setGlobalRank] = useState<{ rank: number; total: number; score: number } | null>(null);
  const isTablet = useIsTablet();
  const isAndroid = useMemo(() => Capacitor.getPlatform() === 'android', []);
  const { toast: uiToast } = useToast();
  const [brixUnlocked, setBrixUnlocked] = useState<boolean>(() => isBrixFactoryUnlocked());
  useEffect(() => {
    const check = () => setBrixUnlocked(isBrixFactoryUnlocked());
    check();
    const id = setInterval(check, 1500);
    window.addEventListener('storage', check);
    return () => { clearInterval(id); window.removeEventListener('storage', check); };
  }, []);

  // Auto-open premium offer every 4 app launches OR daily tip (flags set in main.tsx)
  useEffect(() => {
    const isPremium = localStorage.getItem('ls_premium_no_ads') === 'true';
    const shouldShowPremium = localStorage.getItem('ls_show_premium_this_launch');
    const shouldShowTip = localStorage.getItem('ls_show_tip_this_launch');

    if (!isPremium && shouldShowPremium === 'true') {
      localStorage.removeItem('ls_show_premium_this_launch');
      setTimeout(() => setShowPremiumOffer(true), 1200);
    } else if (shouldShowTip === 'true') {
      localStorage.removeItem('ls_show_tip_this_launch');
      setTimeout(() => setShowDailyTip(true), 800);
    }
  }, []);

  // Timer pour la roue
  useEffect(() => {
    if (hasFreeSpin) return;
    
    const interval = setInterval(() => {
      const remaining = getTimeUntilNextFreeSpin();
      if (remaining <= 0) {
        setHasFreeSpin(true);
        setWheelTimer('00:00:00');
      } else {
        setWheelTimer(formatTimeRemaining(remaining));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [hasFreeSpin]);

  // Vérifier les défis en attente
  useEffect(() => {
    const checkChallenges = () => {
      setHasPendingChallenges(hasPendingChallengeRewards());
    };
    
    checkChallenges();
    
    // Écouter les mises à jour de défis (événement personnalisé)
    const handleChallengeUpdate = () => {
      checkChallenges();
    };
    
    // Écouter aussi le storage event pour les autres onglets
    const handleStorageChange = () => {
      checkChallenges();
    };
    
    window.addEventListener('challengeUpdate', handleChallengeUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    // Vérifier régulièrement au cas où
    const interval = setInterval(checkChallenges, 1000);
    
    return () => {
      window.removeEventListener('challengeUpdate', handleChallengeUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch monthly rank
  useEffect(() => {
    const loadMonthlyRank = async () => {
      try {
        const data = await fetchMonthlyGlobalLeaderboard(100);
        const identity = getLocalIdentity();
        if (identity.username) {
          const idx = data.findIndex(e => e.username.toLowerCase() === identity.username!.toLowerCase());
          if (idx >= 0) {
            setGlobalRank({ rank: idx + 1, total: data.length, score: data[idx].total_score });
          } else {
            setGlobalRank({ rank: 0, total: data.length, score: 0 });
          }
        }
      } catch {}
    };
    loadMonthlyRank();
  }, []);

  const passProgress = Math.min(100, Math.round((getSeasonPassData().currentTier / PASS_TIERS.length) * 100));
  const tap = 'lsm-tap';

  return (
    <>
      <div className="lsm-bg" />
      <div className={`main-menu-container lsm-root ${theme} relative z-10`}>
        {/* Top bar */}
        <div className="flex items-center justify-between shrink-0">
          <div className="lsm-panel flex items-center gap-2 rounded-full pl-1.5 pr-1.5 py-1.5">
            <span className="lsm-coin w-9 h-9 rounded-full flex items-center justify-center font-black text-lg">€</span>
            <span className="text-xl font-black min-w-[3ch]">{coins}</span>
            <button type="button" aria-label={t.shop} onClick={onOpenShop} className={`${tap} w-9 h-9 rounded-full lsm-primary flex items-center justify-center`}>
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <button type="button" aria-label="Settings" onClick={() => setShowSettings(true)} className={`${tap} lsm-panel w-12 h-12 rounded-2xl flex items-center justify-center`}>
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Logo + side buttons */}
        <div className="relative flex items-center justify-between gap-2 min-h-0 flex-1 max-h-[300px]">
          <div className="flex flex-col gap-4 shrink-0 z-10">
            <SideBtn icon={<Gift className="w-7 h-7" />} label={t.gifts} badge={hasAvailableReward ? '!' : undefined} onClick={onOpenDailyRewards} />
            <SideBtn icon={<FileText className="w-7 h-7" />} label={t.news} onClick={() => setShowComingSoon(true)} />
          </div>
          <h1 className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-label="Lucky Stop">
            <span className="lsm-ring" />
            <Crown className="lsm-crown w-14 h-14 fill-current" style={{ top: 'calc(50% - min(34vw, 145px) - 22px)' }} />
            <img src={luckyStopLogo} alt="Lucky Stop" width={1306} height={735} draggable={false}
              className="relative block w-[60%] max-w-[260px] h-auto object-contain lsm-logo" />
          </h1>
          <div className="flex flex-col gap-4 shrink-0 z-10">
            <SideBtn tone="accent" icon={<Clock className="w-7 h-7" />} label={hasFreeSpin ? 'Tour' : wheelTimer} badge={hasFreeSpin ? '1' : undefined} onClick={() => setShowLuckyWheel(true)} pulse={hasFreeSpin} />
            <SideBtn tone="gold" icon={<Tag className="w-7 h-7" />} label="Offres" onClick={() => setShowPremiumOffer(true)} />
          </div>
        </div>

        {/* Main actions */}
        <div className="flex flex-col gap-3 w-full max-w-md mx-auto shrink-0">
          <button type="button" onClick={onOpenGlobalLeaderboard} className={`${tap} lsm-accent-card self-start flex items-center gap-3 rounded-2xl px-4 py-2.5 text-left`}>
            <Trophy className="w-10 h-10 lsm-goldc fill-current" />
            <div className="leading-tight">
              <div className="text-[10px] tracking-widest lsm-muted uppercase">Classement</div>
              <div className="text-lg font-black lsm-cyan tracking-wide">GLOBAL</div>
              <div className="flex items-center gap-1 text-sm font-bold"><Crown className="w-3.5 h-3.5 lsm-goldc fill-current" />{globalRank && globalRank.rank > 0 ? `#${globalRank.rank}` : '—'}</div>
            </div>
            <ChevronRight className="w-6 h-6 lsm-muted ml-6" />
          </button>

          <button type="button" onClick={onStartGame} className={`${tap} lsm-play w-full rounded-[1.75rem] py-5 flex items-center justify-center gap-4`}>
            <Play className="w-10 h-10 fill-current lsm-play-icon" />
            <span className="w-px h-10 bg-current opacity-40" />
            <span className="text-4xl font-black tracking-[0.12em] uppercase">{t.playNow?.split(' ')[0] || 'Jouer'}</span>
          </button>

          <button type="button" onClick={() => setShowSeasonPass(true)} className={`${tap} lsm-panel lsm-pass w-full rounded-2xl px-4 py-3 flex items-center gap-4 relative`}>
            <span className="lsm-pass-icon w-12 h-12 rounded-xl flex items-center justify-center"><Crown className="w-7 h-7 fill-current" /></span>
            <div className="flex-1 text-left">
              <div className="text-base font-black tracking-widest uppercase">Pass de saison</div>
              <div className="mt-2 h-2.5 rounded-full lsm-bar overflow-hidden"><div className="h-full rounded-full lsm-bar-fill" style={{ width: `${Math.max(passProgress, 4)}%` }} /></div>
            </div>
            <ChevronRight className="w-6 h-6 lsm-muted relative z-10" />
            {hasPassReward && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full lsm-badge" />}
          </button>

          <button type="button" onClick={() => {
              if (!brixUnlocked) { try { sessionStorage.setItem('challenges_focus_brix', '1'); } catch {} onOpenChallenges(); return; }
              onOpenBrixFactory?.();
            }} className={`${tap} lsm-panel lsm-factory w-full rounded-2xl px-4 py-3 flex items-center gap-4`}>
            <span className="lsm-lock-icon relative z-10 w-12 h-12 rounded-xl flex items-center justify-center">
              {brixUnlocked ? <Boxes className="w-6 h-6" /> : <Lock className="w-6 h-6 fill-current" />}
            </span>
            <span className="flex-1 text-left text-base font-black tracking-widest uppercase relative z-10">Brix Factory</span>
            <ChevronRight className="w-6 h-6 lsm-muted relative z-10" />
          </button>
        </div>

        {/* Bottom nav */}
        <nav className="lsm-panel lsm-nav grid grid-cols-4 rounded-3xl py-2 w-full max-w-md mx-auto shrink-0">
          <NavBtn icon={<ShoppingBag className="w-6 h-6" />} label={t.shop} onClick={onOpenShop} active />
          <NavBtn icon={<Box className="w-6 h-6" />} label="Inventaire" onClick={() => setShowInventory(true)} />
          <NavBtn icon={<Star className="w-6 h-6" />} label="Défis" onClick={onOpenChallenges} badge={hasPendingChallenges ? '!' : undefined} />
          <NavBtn icon={<Trophy className="w-6 h-6" />} label="Classement" onClick={onOpenLeaderboard} />
        </nav>

      {/* Social Media Dialog */}
      <AlertDialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <AlertDialogContent className="bg-gradient-to-b from-button-bg via-button-bg to-button-bg/95 border border-primary/25 shadow-[0_12px_48px_hsl(var(--primary)/0.18),0_0_0_1px_hsl(var(--wheel-border)/0.4)] rounded-3xl p-0 overflow-hidden gap-0 max-w-[400px]">
          {/* Top decorative bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary" />

          <div className="px-6 pt-6 pb-5">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-primary text-center flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/15 flex items-center justify-center shadow-[inset_0_1px_2px_hsl(var(--primary)/0.25)]">
                  <Sparkles className="w-6 h-6 text-secondary" />
                </div>
                <span className="text-xl font-black bg-gradient-primary bg-clip-text text-transparent tracking-tight">
                  {t.joinUs}
                </span>
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-text-secondary pt-1 text-[13px] leading-relaxed">
                {t.socialDesc}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Concours / News block — top priority */}
            <div className="mt-5 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 border border-primary/20 p-4">
              <p className="text-center mb-3">
                <span className="text-[15px] font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {t.newsAndContest}
                </span>
              </p>
              <Button
                onClick={() => {
                  window.open('https://luckystop.fr', '_blank');
                }}
                className="w-full rounded-xl bg-gradient-to-r from-primary via-primary to-secondary hover:from-primary hover:via-secondary hover:to-secondary shadow-[0_4px_16px_hsl(var(--primary)/0.35)] hover:shadow-[0_6px_24px_hsl(var(--primary)/0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 py-5 flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Trophy className="w-5 h-5 drop-shadow-sm" />
                <span className="font-bold text-[15px] tracking-wide drop-shadow-sm">{t.contest}</span>
              </Button>
            </div>

            {/* Rate App Button */}
            {onOpenRateDialog && (
              <div className="mt-4">
                <Button
                  onClick={() => {
                    setShowComingSoon(false);
                    setTimeout(() => onOpenRateDialog(), 300);
                  }}
                  className="w-full py-5 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary/80 hover:from-primary/90 hover:via-primary hover:to-secondary shadow-[0_6px_24px_hsl(var(--primary)/0.4),0_2px_8px_hsl(var(--secondary)/0.2)] hover:shadow-[0_8px_32px_hsl(var(--primary)/0.55),0_4px_12px_hsl(var(--secondary)/0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <Star className="w-5 h-5 fill-current drop-shadow-sm" />
                  <span className="font-bold text-[15px] tracking-wide drop-shadow-sm">Laisse-nous un avis !</span>
                  <Star className="w-5 h-5 fill-current drop-shadow-sm" />
                </Button>
              </div>
            )}

            {/* Social networks — at the bottom */}
            <div className="mt-5 pt-4 border-t border-wheel-border/40">
              <p className="text-center text-[10px] uppercase tracking-[0.2em] text-text-muted/80 font-bold mb-3">
                {language === 'es' ? 'Síguenos' : language === 'en' ? 'Follow us' : 'Suivez-nous'}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    window.open('https://www.instagram.com/luckystop_?igsh=a3lmanFkeWdwc3F2', '_blank');
                  }}
                  className="flex-1 bg-button-bg/60 border border-button-border hover:bg-button-hover hover:border-primary/50 transition-all duration-300 flex items-center justify-center gap-2 py-4 rounded-xl"
                >
                  <Instagram className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-text-primary text-sm">Instagram</span>
                </Button>

                <Button
                  onClick={() => {
                    window.open('https://www.tiktok.com/@luckystop_?is_from_webapp=1&sender_device=pc', '_blank');
                  }}
                  className="flex-1 bg-button-bg/60 border border-button-border hover:bg-button-hover hover:border-secondary/50 transition-all duration-300 flex items-center justify-center gap-2 py-4 rounded-xl"
                >
                  <svg className="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <span className="font-semibold text-text-primary text-sm">TikTok</span>
                </Button>
              </div>
            </div>

            <Button
              onClick={() => setShowComingSoon(false)}
              variant="ghost"
              className="mt-3 w-full hover:bg-primary/10 text-text-muted text-sm"
            >
              {t.close}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Season Pass */}
      <SeasonPass
        isOpen={showSeasonPass}
        onClose={() => {
          setShowSeasonPass(false);
          setHasPassReward(hasDailyQuestReward());
        }}
        coins={coins}
        onSpendCoins={onSpendCoins}
      />

      {/* Inventory */}
      <Inventory
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
      />

      {/* Lucky Wheel */}
      <LuckyWheel
        isOpen={showLuckyWheel}
        onClose={() => {
          setShowLuckyWheel(false);
          setHasFreeSpin(canSpinFree());
        }}
        onCoinsWon={onAdRewardClaimed}
      />

      {/* Settings Dialog */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isSoundMuted={isSoundMuted}
        onToggleSound={onToggleSound}
        onOpenRateDialog={onOpenRateDialog}
        onOpenDailyChallenge={onOpenDailyChallenge}
        onOpenDailyTip={() => setShowDailyTip(true)}
        onReplayOnboarding={onReplayOnboarding}
      />

      {/* Premium Offer */}
      <PremiumOffer
        isOpen={showPremiumOffer}
        onClose={() => setShowPremiumOffer(false)}
        onAddCoins={(amount) => onAdRewardClaimed(amount)}
      />

      {/* Daily Tip */}
      <DailyTip
        isOpen={showDailyTip}
        onClose={() => setShowDailyTip(false)}
      />
    </div>
    </>
  );
};

const SideBtn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; badge?: string; tone?: 'default' | 'accent' | 'gold'; pulse?: boolean }> = ({ icon, label, onClick, badge, tone = 'default', pulse }) => (
  <button type="button" onClick={onClick} className="lsm-tap flex flex-col items-center gap-1.5">
    <span className={`lsm-panel lsm-side lsm-side-${tone} relative w-[60px] h-[60px] rounded-2xl flex items-center justify-center ${pulse ? 'animate-pulse-glow' : ''}`}>
      {icon}
      {badge && <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full lsm-badge text-xs font-black flex items-center justify-center">{badge}</span>}
    </span>
    <span className="text-[11px] font-bold tracking-wider uppercase max-w-[72px] truncate">{label}</span>
  </button>
);

const NavBtn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; badge?: string; active?: boolean }> = ({ icon, label, onClick, badge, active }) => (
  <button type="button" onClick={onClick} className={`lsm-tap relative flex flex-col items-center gap-1 py-1 ${active ? 'lsm-nav-active' : 'lsm-nav-idle'}`}>
    <span className="relative">{icon}{badge && <span className="absolute -top-2 -right-3 w-[18px] h-[18px] rounded-full lsm-badge text-[10px] font-black flex items-center justify-center">{badge}</span>}</span>
    <span className="text-[10px] font-bold tracking-wider uppercase truncate max-w-full">{label}</span>
    {active && <span className="absolute -bottom-1 w-10 h-1 rounded-full lsm-nav-ind" />}
  </button>
);
