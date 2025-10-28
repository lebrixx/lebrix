import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ShoppingBag, Trophy, Star, Coins, Gamepad2, Crown, Gift, Languages, Sparkles, Tv, Settings as SettingsIcon, Instagram } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage, translations, Language } from '@/hooks/useLanguage';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AdRewardDialog } from '@/components/AdRewardDialog';
import { Settings } from '@/components/Settings';

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
  isSoundMuted = false,
  onToggleSound = () => {}
}) => {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showAdReward, setShowAdReward] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  return (
    <div className={`main-menu-container bg-gradient-game ${theme} pt-safe`}>
      {/* Free Coins Button - Discret */}
      <Button
        onClick={() => setShowAdReward(true)}
        variant="ghost"
        size="sm"
        className="absolute top-16 left-4 hover:bg-primary/10 transition-all duration-300 gap-1 opacity-60 hover:opacity-100"
      >
        <Tv className="w-3 h-3 text-text-muted" />
        <span className="text-xs text-text-muted">
          Free Coins
        </span>
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative hover:bg-primary/20 transition-all duration-300 gap-1.5"
              >
                <Languages className="w-4 h-4 text-text-muted" />
                <span className="text-xs text-text-muted">{t.language}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2 bg-button-bg border-wheel-border z-50 max-h-72 overflow-y-auto">
              <div className="flex flex-col gap-1">
                {[
                  { code: 'fr', label: '🇫🇷 Français' },
                  { code: 'en', label: '🇬🇧 English' },
                  { code: 'es', label: '🇪🇸 Español' },
                  { code: 'de', label: '🇩🇪 Deutsch' },
                  { code: 'it', label: '🇮🇹 Italiano' },
                  { code: 'pt', label: '🇵🇹 Português' },
                  { code: 'ar', label: '🇸🇦 العربية' },
                  { code: 'ja', label: '🇯🇵 日本語' },
                  { code: 'zh', label: '🇨🇳 中文' },
                ].map(({ code, label }) => (
                  <Button
                    key={code}
                    onClick={() => setLanguage(code as Language)}
                    variant={language === code ? 'default' : 'ghost'}
                    size="sm"
                    className="justify-start text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

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
            <Badge variant="secondary" className="ml-2 bg-secondary text-game-dark text-xs">
              {coins}
            </Badge>
          </Button>

          <Button 
            onClick={onOpenChallenges}
            variant="outline"
            size="lg"
            className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 py-2.5 text-sm group"
          >
            <Star className="w-4 h-4 mr-2 group-hover:animate-spin" />
            {t.dailyChallenges}
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
        {/* Current Theme & Mode */}
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
                // TikTok link will be added later
                setShowComingSoon(false);
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
            <p className="text-center text-text-primary font-semibold mb-3">
              {t.contest}
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

      {/* Ad Reward Dialog */}
      <AdRewardDialog
        isOpen={showAdReward}
        onClose={() => setShowAdReward(false)}
        onRewardClaimed={onAdRewardClaimed}
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