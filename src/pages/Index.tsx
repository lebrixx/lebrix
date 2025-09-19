import React, { useState, useEffect } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { GameWheel } from '@/components/GameWheel';
import { Shop } from '@/components/Shop';
import { Challenges } from '@/components/Challenges';
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
            theme={currentTheme}
            onStartGame={() => setCurrentScreen('game')}
            onOpenShop={() => setCurrentScreen('shop')}
            onOpenChallenges={() => setCurrentScreen('challenges')}
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
            onBack={() => setCurrentScreen('menu')}
            onPurchase={spendCoins}
          />
        );
      
      case 'challenges':
        const gameStats = {
          totalGames: parseInt(localStorage.getItem('totalGames') || '0'),
          totalWins: parseInt(localStorage.getItem('totalWins') || '0'),
          bestScore: gameState.bestScore,
          perfectRounds: parseInt(localStorage.getItem('perfectRounds') || '0'),
          fastRounds: parseInt(localStorage.getItem('fastRounds') || '0'),
        };

        return (
          <Challenges 
            coins={gameState.coins}
            onBack={() => setCurrentScreen('menu')}
            onRewardClaim={(reward) => {
              // Add coins from challenge rewards
              gameState.coins += reward;
            }}
            gameStats={gameStats}
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
