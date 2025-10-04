import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ShoppingBag, Trophy, Star, Coins, Gamepad2, Crown, Gift } from 'lucide-react';

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
  hasAvailableReward
}) => {
  return (
    <div className={`main-menu-container bg-gradient-game ${theme}`}>
      {/* Logo/Title */}
      <div className="text-center animate-fade-in mt-16">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1"></div>
          <div className="flex-1">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4 drop-shadow-2xl animate-float">
              LUCKY STOP
            </h1>
          </div>
          <div className="flex-1"></div>
        </div>
        
        {/* Bouton cadeau déplacé sous le titre */}
        <div className="flex justify-center mb-2">
          <Button
            onClick={onOpenDailyRewards}
            variant="ghost"
            size="icon"
            className={`
              relative hover:bg-primary/20 transition-all duration-300
              ${hasAvailableReward ? 'animate-pulse-glow' : ''}
            `}
          >
            <Gift className={`w-4 h-4 ${hasAvailableReward ? 'text-primary' : 'text-text-muted'}`} />
            {hasAvailableReward && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center min-h-0">
        {/* Subtitle closer to cards */}
        <div className="text-center mb-3">
          <p className="text-text-secondary text-base">
            Tapez dans la zone verte au bon moment!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4 w-full max-w-md animate-scale-in">
          <Card className="bg-button-bg border-wheel-border p-3 text-center hover:scale-105 transition-transform duration-300">
            <Trophy className="w-6 h-6 text-primary mx-auto mb-1" />
            <div className="text-xl font-bold text-primary">{bestScore}</div>
            <div className="text-xs text-text-muted">Meilleur Score</div>
          </Card>
          
          <Card className="bg-button-bg border-wheel-border p-3 text-center hover:scale-105 transition-transform duration-300">
            <Coins className="w-6 h-6 text-secondary mx-auto mb-1" />
            <div className="text-xl font-bold text-secondary">{coins}</div>
            <div className="text-xs text-text-muted">Coins</div>
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
            JOUER MAINTENANT
          </Button>

          <Button
            onClick={onOpenModes}
            variant="outline"
            size="lg"
            className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 py-2.5 text-sm group"
          >
            <Gamepad2 className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            MODES DE JEU
          </Button>

          <Button
            onClick={onOpenShop}
            variant="outline"
            size="lg"
            className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 py-2.5 text-sm group"
          >
            <ShoppingBag className="w-4 h-4 mr-2 group-hover:animate-bounce" />
            BOUTIQUE
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
            DÉFIS QUOTIDIENS
          </Button>

          <Button
            onClick={onOpenLeaderboard}
            variant="outline"
            size="lg"
            className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 py-2.5 text-sm group"
          >
            <Crown className="w-4 h-4 mr-2 group-hover:animate-bounce" />
            CLASSEMENT EN LIGNE
          </Button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center space-y-2 mt-auto">
        {/* Current Theme & Mode */}
        <div className="flex justify-center gap-4 animate-fade-in">
          <div className="text-center">
            <div className="text-xs text-text-muted mb-0.5">Thème</div>
            <Badge 
              variant="outline" 
              className="border-primary text-primary text-xs px-2 py-0.5 animate-pulse-glow"
            >
              {theme.replace('theme-', '').toUpperCase() || 'NEON'}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-xs text-text-muted mb-0.5">Mode</div>
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
    </div>
  );
};