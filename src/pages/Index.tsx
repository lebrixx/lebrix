import React, { useState } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { CircleTap } from '@/components/CircleTap';
import { Shop } from '@/components/Shop';
import { Challenges } from '@/components/Challenges';
import { ModeSelection } from '@/components/ModeSelection';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useToast } from '@/hooks/use-toast';
import { THEMES } from '@/constants/themes';
import { cfgModes, ModeType, ModeID } from '@/constants/modes';

type GameScreen = 'menu' | 'game' | 'shop' | 'challenges' | 'modes';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu');
  
  // État du thème actuel avec persistance
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    const saved = localStorage.getItem('currentTheme');
    return saved || 'theme-neon';
  });

  // État du mode actuel avec persistance
  const [currentMode, setCurrentMode] = useState<ModeType>(() => {
    const saved = localStorage.getItem('ls_mode');
    return (saved as ModeType) || ModeID.CLASSIC;
  });

  const { gameState, startGame, onTap, resetGame } = useGameLogic(currentMode);
  const { toast } = useToast();

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('currentTheme', theme);
    toast({
      title: "Thème équipé!",
      description: `Le thème a été équipé avec succès.`,
    });
  };

  const handleModeChange = (mode: ModeType) => {
    if (gameState.gameStatus === 'running') {
      toast({
        title: "Impossible de changer de mode",
        description: "Termine ta partie actuelle pour changer de mode.",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentMode(mode);
    localStorage.setItem('ls_mode', mode);
    toast({
      title: "Mode changé!",
      description: `Mode ${cfgModes[mode].name} sélectionné.`,
    });
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <MainMenu
            bestScore={gameState.bestScore}
            coins={gameState.coins}
            theme={currentTheme}
            currentMode={currentMode}
            onStartGame={() => setCurrentScreen('game')}
            onOpenShop={() => setCurrentScreen('shop')}
            onOpenChallenges={() => setCurrentScreen('challenges')}
            onOpenModes={() => setCurrentScreen('modes')}
          />
        );
        
      case 'game':
        return (
          <CircleTap
            theme={currentTheme}
            onBack={() => setCurrentScreen('menu')}
          />
        );
        
      case 'shop':
        return (
          <Shop
            coins={gameState.coins}
            onBack={() => setCurrentScreen('menu')}
          />
        );
        
      case 'challenges':
        return (
          <Challenges
            onBack={() => setCurrentScreen('menu')}
          />
        );

      case 'modes':
        return (
          <ModeSelection
            currentMode={currentMode}
            gameStatus={gameState.gameStatus}
            onSelectMode={handleModeChange}
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