import React, { useState, useEffect } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { CircleTap } from '@/components/CircleTap';
import { Shop } from '@/components/Shop';
import { Challenges } from '@/components/Challenges';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useGameLogic } from '@/hooks/useGameLogic';
import { toast } from 'sonner';

type GameScreen = 'menu' | 'game' | 'shop' | 'challenges' | 'theme-select';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu');
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('luckyStopTheme');
    return saved || 'theme-neon';
  });
  
  const { gameState, spendCoins, purchaseTheme } = useGameLogic();

  // Sauvegarder le thème dans localStorage
  useEffect(() => {
    localStorage.setItem('luckyStopTheme', currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    toast.success('Thème changé!');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <MainMenu
            bestScore={gameState.bestScore}
            coins={gameState.coins}
            theme={currentTheme}
            onStartGame={() => setCurrentScreen('theme-select')}
            onOpenShop={() => setCurrentScreen('shop')}
            onOpenChallenges={() => setCurrentScreen('challenges')}
          />
        );
      
      case 'game':
        return (
          <div className="relative">
            <CircleTap theme={currentTheme} />
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
            onBack={() => setCurrentScreen('menu')}
            onPurchase={spendCoins}
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
          />
        );
      
      case 'challenges':
        return (
          <Challenges 
            coins={gameState.coins}
            onBack={() => setCurrentScreen('menu')}
            onReward={(reward) => {
              // Ajouter des coins depuis les défis
              toast.success(`${reward} coins gagnés!`);
            }}
            currentScore={gameState.currentScore}
            bestScore={gameState.bestScore}
          />
        );

      case 'theme-select':
        return (
          <ThemeSelector
            ownedThemes={gameState.ownedThemes}
            currentTheme={currentTheme}
            onThemeSelect={handleThemeChange}
            onStartGame={() => setCurrentScreen('game')}
            onBack={() => setCurrentScreen('menu')}
          />
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
