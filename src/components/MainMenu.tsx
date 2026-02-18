import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ShoppingBag, Trophy, Star, Coins, Gamepad2, Crown, Gift, Languages, Sparkles, Settings as SettingsIcon, Instagram, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage, translations, Language } from '@/hooks/useLanguage';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Settings } from '@/components/Settings';
import { LuckyWheel } from '@/components/LuckyWheel';
import { SeasonPass } from '@/components/SeasonPass';
import { hasDailyChallengeReward } from '@/utils/seasonPass';
import { useIsTablet } from '@/hooks/use-tablet';
import { hasPendingChallengeRewards } from '@/utils/challengeUtils';
import { canSpinFree, getTimeUntilNextFreeSpin, formatTimeRemaining } from '@/utils/luckyWheel';

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
  hasAvailableReward: boolean;
  onAdRewardClaimed: (coins: number) => void;
  onSpendCoins?: (amount: number) => boolean;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
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
  hasAvailableReward,
  onAdRewardClaimed,
  onSpendCoins,
  isSoundMuted = false,
  onToggleSound = () => {}
}) => {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSeasonPass, setShowSeasonPass] = useState(false);
  const [hasPassReward, setHasPassReward] = useState(hasDailyChallengeReward());
  const [hasPendingChallenges, setHasPendingChallenges] = useState(false);
  const [hasFreeSpin, setHasFreeSpin] = useState(canSpinFree());
  const [wheelTimer, setWheelTimer] = useState(formatTimeRemaining(getTimeUntilNextFreeSpin()));
  const isTablet = useIsTablet();

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
  return (
    <div className={`main-menu-container bg-gradient-game ${theme} pt-safe`}>
      {/* Lucky Wheel Button */}
      <Button
        onClick={() => setShowLuckyWheel(true)}
        variant="ghost"
        size="sm"
        className={`absolute top-16 left-4 hover:bg-primary/10 transition-all duration-300 gap-1.5 ${hasFreeSpin ? 'animate-pulse-glow opacity-100 border border-primary/50 bg-primary/10' : 'opacity-70 hover:opacity-100'}`}
      >
        <RotateCcw className={`w-4 h-4 ${hasFreeSpin ? 'text-primary animate-spin' : 'text-text-muted'}`} style={hasFreeSpin ? { animationDuration: '3s' } : {}} />
        <div className="flex flex-col items-start">
          <span className={`text-xs font-medium ${hasFreeSpin ? 'text-primary' : 'text-text-muted'}`}>
            {hasFreeSpin ? (t.freeSpin || 'Tour Gratuit !') : t.luckyWheelTitle}
          </span>
          {!hasFreeSpin && (
            <span className="text-[10px] text-text-muted font-mono">
              {wheelTimer}
            </span>
          )}
        </div>
        {hasFreeSpin && (
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-secondary rounded-full animate-bounce flex items-center justify-center shadow-glow-primary">
            <span className="text-[8px] text-game-dark font-bold">1</span>
          </div>
        )}
      </Button>

      {/* Settings Button - Top Right */}
      <Button
        onClick={() => setShowSettings(true)}
        variant="ghost"
        size="icon"
        className="absolute top-16 right-4 hover:bg-primary/10 transition-all duration-300 opacity-80 hover:opacity-100"
      >
        <SettingsIcon className="w-5 h-5 text-text-muted" />
      </Button>

      {/* Logo/Title */}
      <div className="text-center animate-fade-in pt-24 mb-6">
        <h1 className="font-bold bg-gradient-primary bg-clip-text text-transparent drop-shadow-2xl animate-float leading-tight">
          <div className="text-6xl md:text-7xl">LUCKY</div>
          <div className="text-6xl md:text-7xl">STOP</div>
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center min-h-0">
        {/* Boutons cadeau, langue et nouveautés */}
        <div className="flex justify-center gap-2 mb-3">
          <Button
            onClick={onOpenDailyRewards}
            variant="ghost"
            size="sm"
            className={`
              relative hover:bg-primary/20 transition-all duration-300 gap-1.5
              ${hasAvailableReward ? 'animate-pulse-glow' : ''}
            `}
          >
            <Gift className={`w-4 h-4 ${hasAvailableReward ? 'text-primary' : 'text-text-muted'}`} />
            <span className="text-xs text-text-muted">{t.gifts}</span>
            {hasAvailableReward && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </Button>

          <Button
            onClick={() => setShowSeasonPass(true)}
            variant="ghost"
            size="sm"
            className={`relative hover:bg-primary/20 transition-all duration-300 gap-1.5 ${hasPassReward ? 'animate-pulse-glow' : ''}`}
          >
            <Crown className="w-4 h-4 text-secondary" />
            <span className="text-xs text-text-muted">Pass</span>
            {hasPassReward && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full animate-pulse" />
            )}
          </Button>

          <Button
            onClick={() => setShowComingSoon(true)}
            variant="ghost"
            size="sm"
            className="relative hover:bg-primary/20 transition-all duration-300 gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-text-muted" />
            <span className="text-xs text-text-muted">{t.news}</span>
          </Button>

        </div>

        {/* Subtitle */}
        <div className="text-center mb-3">
          <p className="text-text-secondary text-base">
            {t.subtitle}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4 w-full max-w-md animate-scale-in">
          <Card className="bg-button-bg border-wheel-border p-3 text-center hover:scale-105 transition-transform duration-300">
            <Trophy className="w-6 h-6 text-primary mx-auto mb-1" />
            <div className="text-xl font-bold text-primary">{bestScore}</div>
            <div className="text-xs text-text-muted">{t.bestScore}</div>
          </Card>
          
          <Card className="bg-button-bg border-wheel-border p-3 text-center hover:scale-105 transition-transform duration-300">
            <Coins className="w-6 h-6 text-secondary mx-auto mb-1" />
            <div className="text-xl font-bold text-secondary">{coins}</div>
            <div className="text-xs text-text-muted">{t.coins}</div>
          </Card>
        </div>

        {/* Main Menu Buttons */}
        <div className="flex flex-col gap-2 w-full max-w-sm animate-fade-in">
          <Button 
            onClick={onStartGame}
            size="lg"
            className="bg-gradient-primary hover:scale-105 shadow-glow-primary transition-all duration-300 py-4 text-base font-bold group"
          >
            <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            {t.playNow}
          </Button>

          <Button
            onClick={onOpenModes}
            variant="outline"
            size="lg"
            className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 py-2.5 text-sm group"
          >
            <Gamepad2 className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            {t.gameModes}
          </Button>

          <Button
            onClick={onOpenShop}
            variant="outline"
            size="lg"
            className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 py-2.5 text-sm group"
          >
            <ShoppingBag className="w-4 h-4 mr-2 group-hover:animate-bounce" />
            {t.shop}
          </Button>

          <Button 
            onClick={onOpenChallenges}
            variant="outline"
            size="lg"
            className={`relative border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 py-2.5 text-sm group ${hasPendingChallenges ? 'animate-pulse-glow border-secondary' : ''}`}
          >
            <Star className={`w-4 h-4 mr-2 group-hover:animate-spin ${hasPendingChallenges ? 'text-secondary' : ''}`} />
            {t.dailyChallenges}
            {hasPendingChallenges && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-pulse flex items-center justify-center">
                <span className="text-[8px] text-game-dark font-bold">!</span>
              </div>
            )}
          </Button>

          <Button
            onClick={onOpenLeaderboard}
            variant="outline"
            size="lg"
            className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 py-2.5 text-sm group"
          >
            <Crown className="w-4 h-4 mr-2 group-hover:animate-bounce" />
            {t.onlineLeaderboard}
          </Button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center space-y-2 mt-auto">
        {/* Current Theme & Mode - Caché sur iPad */}
        {!isTablet && (
          <div className="flex justify-center gap-4 animate-fade-in">
            <div className="text-center">
              <div className="text-xs text-text-muted mb-0.5">{t.theme}</div>
              <Badge 
                variant="outline" 
                className="border-primary text-primary text-xs px-2 py-0.5 animate-pulse-glow"
              >
                {theme.replace('theme-', '').toUpperCase() || 'NEON'}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-xs text-text-muted mb-0.5">{t.mode}</div>
              <Badge 
                variant="outline" 
                className="border-secondary text-secondary text-xs px-2 py-0.5"
              >
                {currentMode.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        )}

        {/* Version Info */}
        <div className="text-text-muted text-xs animate-fade-in">
          Lucky Stop v1.0
        </div>
      </div>

      {/* Floating Mini Wheel */}
      <div className="absolute top-20 right-8 w-16 h-16 rounded-full bg-gradient-wheel border-2 border-wheel-border animate-spin-wheel opacity-20 hidden lg:block" 
           style={{ animationDuration: '8s' }}>
        <div className="absolute inset-2 rounded-full bg-primary opacity-30"></div>
      </div>

      {/* Social Media Dialog */}
      <AlertDialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <AlertDialogContent className="bg-button-bg border-wheel-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary text-center flex flex-col items-center gap-3">
              <Sparkles className="w-6 h-6 text-secondary" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {t.joinUs}
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-text-secondary pt-2 pb-4 text-sm leading-relaxed">
              {t.socialDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex gap-3 pb-2">
            <Button 
              onClick={() => {
                window.open('https://www.instagram.com/luckystop_?igsh=a3lmanFkeWdwc3F2', '_blank');
              }}
              className="flex-1 bg-button-bg border border-button-border hover:bg-button-hover hover:border-primary/50 transition-all duration-300 flex items-center justify-center gap-2 py-6"
            >
              <Instagram className="w-5 h-5 text-primary" />
              <span className="font-semibold text-text-primary">Instagram</span>
            </Button>
            
            <Button 
              onClick={() => {
                window.open('https://www.tiktok.com/@luckystop_?is_from_webapp=1&sender_device=pc', '_blank');
              }}
              className="flex-1 bg-button-bg border border-button-border hover:bg-button-hover hover:border-secondary/50 transition-all duration-300 flex items-center justify-center gap-2 py-6"
            >
              <svg className="w-5 h-5 text-secondary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span className="font-semibold text-text-primary">TikTok</span>
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-wheel-border">
            <p className="text-center mb-4">
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {t.newsAndContest}
              </span>
            </p>
            <Button 
              onClick={() => {
                window.open('https://luckystop.fr', '_blank');
              }}
              className="w-full bg-gradient-primary hover:scale-105 shadow-glow-primary transition-all duration-300 py-6"
            >
              <Trophy className="w-5 h-5 mr-2" />
              <span className="font-bold">{t.contest}</span>
            </Button>
          </div>
          
          <Button 
            onClick={() => setShowComingSoon(false)}
            variant="ghost"
            className="mt-2 hover:bg-primary/10"
          >
            {t.close}
          </Button>
        </AlertDialogContent>
      </AlertDialog>

      {/* Season Pass */}
      <SeasonPass
        isOpen={showSeasonPass}
        onClose={() => {
          setShowSeasonPass(false);
          setHasPassReward(hasDailyChallengeReward());
        }}
        coins={coins}
        onSpendCoins={onSpendCoins}
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
      />
    </div>
  );
};