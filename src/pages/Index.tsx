import React, { useState, useEffect } from 'react';
import { CircleTap } from '@/components/CircleTap';
import { useGameLogic } from '@/hooks/useGameLogic';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Play, Trophy } from 'lucide-react';

type GameScreen = 'menu' | 'game';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu');
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('circletap-theme');
    return saved || 'theme-neon';
  });
  
  const { gameState } = useGameLogic();

  // Sauvegarder le thème dans localStorage
  useEffect(() => {
    localStorage.setItem('circletap-theme', currentTheme);
  }, [currentTheme]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <div className={`min-h-screen bg-gradient-game flex flex-col items-center justify-center p-4 ${currentTheme}`}>
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-6xl font-bold text-primary mb-4 drop-shadow-lg">
                Circle Tap
              </h1>
              <p className="text-xl text-text-secondary mb-8">
                Tapez quand la bille est dans la zone verte
              </p>
              
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{gameState.bestScore}</div>
                    <div className="text-sm text-text-muted">Meilleur Score</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => setCurrentScreen('game')}
                  size="lg"
                  className="bg-gradient-primary hover:scale-105 shadow-glow-primary transition-all duration-300 px-8 py-4 text-lg font-bold"
                >
                  <Play className="w-6 h-6 mr-2" />
                  JOUER
                </Button>
              </div>
            </div>

            <div className="text-center text-text-muted text-sm">
              <p>Appuyez sur ESPACE ou ENTRÉE pour jouer</p>
              <p className="mt-2">Restez concentré sur la zone verte!</p>
            </div>
          </div>
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
