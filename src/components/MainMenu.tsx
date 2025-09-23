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
      <div className="text-center animate-fade-in mt-12">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1"></div>
          <div className="flex-1">
            <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2 drop-shadow-2xl animate-float">
              LUCKY STOP
            </h1>
            <p className="text-text-secondary text-lg">
              Tapez dans la zone verte au bon moment!
            </p>
          </div>
          <div className="flex-1 flex justify-end pr-8">
            <Button
              onClick={onOpenDailyRewards}
              variant="ghost"
              size="icon"
              className={`
                relative hover:bg-primary/20 transition-all duration-300 mr-2
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6 w-full max-w-md animate-scale-in">
          <Card className="bg-button-bg border-wheel-border p-4 text-center hover:scale-105 transition-transform duration-300">
            <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">{bestScore}</div>
            <div className="text-sm text-text-muted">Meilleur Score</div>
          </Card>
          
          <Card className="bg-button-bg border-wheel-border p-4 text-center hover:scale-105 transition-transform duration-300">
            <Coins className="w-8 h-8 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold text-secondary">{coins}</div>
            <div className="text-sm text-text-muted">Coins</div>
          </Card>
        </div>

        {/* Main Menu Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm animate-fade-in">
          <Button 
            onClick={onStartGame}
            size="lg"
            className="bg-gradient-primary hover:scale-105 shadow-glow-primary transition-all duration-300 py-5 text-lg font-bold group"
          >
            <Play className="w-6 h-6 mr-2 group-hover:animate-pulse" />
            JOUER MAINTENANT
          </Button>

          <Button
            onClick={onOpenModes}
            variant="outline"
            size="lg"
            className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 py-3 text-base group"
          >
            <Gamepad2 className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            MODES DE JEU
          </Button>

          <Button
            onClick={onOpenShop}
            variant="outline"
            size="lg"
            className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 py-3 text-base group"
          >
            <ShoppingBag className="w-5 h-5 mr-2 group-hover:animate-bounce" />
            BOUTIQUE
            <Badge variant="secondary" className="ml-2 bg-secondary text-game-dark">
              {coins}
            </Badge>
          </Button>

          <Button 
            onClick={onOpenChallenges}
            variant="outline"
            size="lg"
            className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 py-3 text-base group"
          >
            <Star className="w-5 h-5 mr-2 group-hover:animate-spin" />
            DÉFIS QUOTIDIENS
          </Button>

          <Button
            onClick={onOpenLeaderboard}
            variant="outline"
            size="lg"
            className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 py-3 text-base group"
          >
            <Crown className="w-5 h-5 mr-2 group-hover:animate-bounce" />
            CLASSEMENT EN LIGNE
          </Button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center space-y-3">
        {/* Current Theme & Mode */}
        <div className="flex justify-center gap-6 animate-fade-in">
          <div className="text-center">
            <div className="text-xs text-text-muted mb-1">Thème</div>
            <Badge 
              variant="outline" 
              className="border-primary text-primary text-xs px-3 py-1 animate-pulse-glow"
            >
              {theme.replace('theme-', '').toUpperCase() || 'NEON'}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-xs text-text-muted mb-1">Mode</div>
            <Badge 
              variant="outline" 
              className="border-secondary text-secondary text-xs px-3 py-1"
            >
              {currentMode.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-text-muted text-xs animate-fade-in">
          Lucky Stop v1.0 • Made with ❤️
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