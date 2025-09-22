import React, { useState } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { CircleTap } from '@/components/CircleTap';
import { Shop } from '@/components/Shop';
import { Challenges } from '@/components/Challenges';
import { ModeSelection } from '@/components/ModeSelection';
import { ScoreSync } from '@/components/ScoreSync';
import { Leaderboard } from '@/pages/Leaderboard';
import { Auth } from '@/pages/Auth';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { THEMES } from '@/constants/themes';
import { cfgModes, ModeType, ModeID } from '@/constants/modes';

type GameScreen = 'menu' | 'game' | 'shop' | 'challenges' | 'modes' | 'leaderboard' | 'auth';

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

  const { gameState, startGame, onTap, resetGame, cfg, spendCoins, addCoins } = useGameLogic(currentMode);
  const { user, profile, loading: authLoading, signOut, updateLeaderboard, isAuthenticated } = useAuth();
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
    
    // Si on sélectionne le mode actuel, lancer le jeu directement
    if (mode === currentMode || currentScreen === 'modes') {
      setCurrentScreen('game');
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <MainMenu
            bestScore={(() => {
              const saved = localStorage.getItem('luckyStopGame');
              const data = saved ? JSON.parse(saved) : {};
              return data[`bestScore_${currentMode}`] || 0;
            })()}
            coins={gameState.coins}
            theme={currentTheme}
            currentMode={currentMode}
            onStartGame={() => setCurrentScreen('game')}
            onOpenShop={() => setCurrentScreen('shop')}
            onOpenChallenges={() => setCurrentScreen('challenges')}
            onOpenModes={() => setCurrentScreen('modes')}
            onOpenLeaderboard={() => setCurrentScreen('leaderboard')}
            onOpenAuth={() => setCurrentScreen('auth')}
            onSignOut={handleSignOut}
            username={profile?.username}
            isAuthenticated={isAuthenticated}
          />
        );
        
        case 'game':
          return (
            <>
              <CircleTap
                theme={currentTheme}
                currentMode={currentMode}
                onBack={() => setCurrentScreen('menu')}
              />
              <ScoreSync gameState={gameState} currentMode={currentMode} />
            </>
          );
        
      case 'shop':
        return (
          <Shop
            coins={gameState.coins}
            ownedThemes={gameState.ownedThemes}
            currentTheme={currentTheme}
            onBack={() => setCurrentScreen('menu')}
            onPurchaseTheme={(theme) => spendCoins(theme.price)}
            onEquipTheme={handleThemeChange}
          />
        );
        
      case 'challenges':
        return (
          <Challenges
            onBack={() => setCurrentScreen('menu')}
            currentScore={gameState.currentScore}
            bestScore={gameState.bestScore}
            coins={gameState.coins}
            maxSpeedReached={gameState.maxSpeedReached}
            directionChanges={gameState.directionChanges}
            totalGamesPlayed={gameState.totalGamesPlayed}
            onReward={addCoins}
          />
        );

        case 'modes':
          const bestScores = {
            classic: JSON.parse(localStorage.getItem('luckyStopGame') || '{}')[`bestScore_classic`] || 0,
            arc_changeant: JSON.parse(localStorage.getItem('luckyStopGame') || '{}')[`bestScore_arc_changeant`] || 0,
            survie_60s: JSON.parse(localStorage.getItem('luckyStopGame') || '{}')[`bestScore_survie_60s`] || 0,
            zone_mobile: JSON.parse(localStorage.getItem('luckyStopGame') || '{}')[`bestScore_zone_mobile`] || 0,
          };
          
          return (
            <ModeSelection
              currentMode={currentMode}
              gameStatus={gameState.gameStatus}
              bestScores={bestScores}
              onSelectMode={handleModeChange}
              onBack={() => setCurrentScreen('menu')}
            />
          );
          
        case 'leaderboard':
          return (
            <Leaderboard
              onBack={() => setCurrentScreen('menu')}
            />
          );
          
        case 'auth':
          return (
            <Auth
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