import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ShoppingBag, Trophy, Star, Coins, Gamepad2, Crown, Gift, Languages, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage, translations, Language } from '@/hooks/useLanguage';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ProfileButton } from '@/components/ProfileButton';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';

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
  onOpenProfile: () => void;
  hasAvailableReward: boolean;
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
  onOpenProfile,
  hasAvailableReward
}) => {
  const { language, setLanguage } = useLanguage();
  const { playerLevel } = usePlayerLevel();
  const t = translations[language];
  const [showComingSoon, setShowComingSoon] = useState(false);
  return (
    <div className={`main-menu-container bg-gradient-game ${theme}`}>
      {/* Logo/Title */}
      <div className="text-center animate-fade-in mt-16">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 flex justify-start pl-2">
            <ProfileButton 
              level={playerLevel.level} 
              onClick={onOpenProfile} 
            />
          </div>
          <div className="flex-1">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4 drop-shadow-2xl animate-float">
              LUCKY STOP
            </h1>
          </div>
          <div className="flex-1"></div>
        </div>
        
        {/* Boutons cadeau, langue et nouveautés */}
        <div className="flex justify-center gap-2 mb-2">
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
            <PopoverContent className="w-32 p-2 bg-button-bg border-wheel-border z-50">
              <div className="flex flex-col gap-1">
                {(['fr', 'en', 'es'] as Language[]).map((lang) => (
                  <Button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    variant={language === lang ? 'default' : 'ghost'}
                    size="sm"
                    className="justify-start text-xs"
                  >
                    {lang === 'fr' ? '🇫🇷 Français' : lang === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
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
            <span className="text-xs text-text-muted">{t.new}</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center min-h-0">
        {/* Subtitle closer to cards */}
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

      {/* Coming Soon Dialog */}
      <AlertDialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <AlertDialogContent className="bg-button-bg border-wheel-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary text-center flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              {t.comingSoon}
              <Sparkles className="w-5 h-5" />
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-text-secondary">
              {t.comingSoonDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button 
            onClick={() => setShowComingSoon(false)}
            className="bg-gradient-primary hover:scale-105 transition-all"
          >
            OK
          </Button>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};