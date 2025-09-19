import React, { useState, useEffect } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { GameWheel } from '@/components/GameWheel';
import { Shop } from '@/components/Shop';
import { useGameLogic } from '@/hooks/useGameLogic';
import { toast } from 'sonner';

type GameScreen = 'menu' | 'game' | 'shop' | 'challenges';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu');
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('luckyStopTheme');
    return saved || 'theme-neon';
  });
  
  const { gameState, spendCoins } = useGameLogic();

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('luckyStopTheme', currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    toast.success('Theme changed!');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <MainMenu
            bestScore={gameState.bestScore}
            coins={gameState.coins}
            currentTheme={currentTheme}
            onPlay={() => setCurrentScreen('game')}
            onShop={() => setCurrentScreen('shop')}
            onChallenges={() => setCurrentScreen('challenges')}
          />
        );
      
      case 'game':
        return (
          <div className="relative">
            <GameWheel theme={currentTheme} />
            <button
              onClick={() => setCurrentScreen('menu')}
              className="absolute top-4 left-4 px-4 py-2 bg-button-bg border border-wheel-border rounded-lg text-text-primary hover:bg-button-hover transition-colors"
            >
              ← Menu
            </button>
          </div>
        );
      
      case 'shop':
        return (
          <Shop
            coins={gameState.coins}
            currentTheme={currentTheme}
            onBack={() => setCurrentScreen('menu')}
            onThemeChange={handleThemeChange}
            onSpendCoins={spendCoins}
          />
        );
      
      case 'challenges':
        return (
          <div className={`min-h-screen bg-gradient-game flex items-center justify-center ${currentTheme}`}>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-primary mb-4">Daily Challenges</h1>
              <p className="text-text-secondary mb-8">Coming Soon!</p>
              <button
                onClick={() => setCurrentScreen('menu')}
                className="px-6 py-3 bg-gradient-primary rounded-lg text-game-dark font-bold hover:scale-105 transition-transform"
              >
                Back to Menu
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="overflow-hidden">
      {renderScreen()}
    </div>
  );
};

export default Index;
