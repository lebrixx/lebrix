import React, { useState, useEffect } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { CircleTap } from '@/components/CircleTap';
import { Shop } from '@/components/Shop';
import { Challenges } from '@/components/Challenges';
import { ModeSelection } from '@/components/ModeSelection';
import { OnlineLeaderboard } from '@/components/OnlineLeaderboard';
import { GlobalLeaderboard } from '@/components/GlobalLeaderboard';
import { UsernameModal } from '@/components/UsernameModal';
import { SubmitScoreModal } from '@/components/SubmitScoreModal';
import { DailyRewards } from '@/components/DailyRewards';
import { DailyChallenge } from '@/components/DailyChallenge';
import { PongCirculaire } from '@/components/PongCirculaire';

import { useGameLogic } from '@/hooks/useGameLogic';
import { useBoosts } from '@/hooks/useBoosts';
import { useToast } from '@/hooks/use-toast';
import { THEMES } from '@/constants/themes';
import { cfgModes, ModeType, ModeID } from '@/constants/modes';
import { getLocalIdentity } from '@/utils/localIdentity';
import { canClaimReward, resetDayIfNeeded } from '@/utils/dailyRewards';
import { updateDailyChallengeProgress } from '@/utils/dailyChallenges';
import { updateQuestScore, updateQuestBoostUsed } from '@/utils/seasonPass';
import { BoostType } from '@/types/boosts';
import { useSound } from '@/hooks/useSound';
import { isPongUnlocked } from '@/utils/pongUnlock';
import { initNotifications } from '@/utils/notifications';
import { RateAppDialog, shouldShowRateDialog, incrementRateGameCount } from '@/components/RateAppDialog';

type GameScreen = 'menu' | 'game' | 'shop' | 'challenges' | 'modes' | 'leaderboard' | 'daily_challenge' | 'global_leaderboard';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showSubmitScoreModal, setShowSubmitScoreModal] = useState(false);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [lastGameScore, setLastGameScore] = useState(0);
  const [hasAvailableReward, setHasAvailableReward] = useState(false);
  const [selectedBoostsForGame, setSelectedBoostsForGame] = useState<BoostType[]>([]);
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [pendingRateDialog, setPendingRateDialog] = useState(false);
  
  // État du thème actuel avec persistance
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    const saved = localStorage.getItem('currentTheme');
    return saved || 'theme-neon';
  });

  // État du mode actuel avec persistance
  const [currentMode, setCurrentMode] = useState<ModeType>(() => {
    const saved = localStorage.getItem('ls_mode');
    return (saved as ModeType) || 'classic'; // Mode par défaut classic
  });

  // Modes débloqués avec persistance
  const [unlockedModes, setUnlockedModes] = useState<string[]>(() => {
    const freeModes = ['classic', 'arc_changeant', 'survie_60s', 'zone_mobile', 'memoire_expert']; // Modes gratuits
    const saved = localStorage.getItem('unlockedModes');
    let base: string[] = freeModes;

    if (saved) {
      try {
        const savedModes = JSON.parse(saved);
        base = [...new Set([...freeModes, ...savedModes])];
      } catch {
        base = freeModes;
      }
    }

    // Pong Circulaire est débloqué uniquement via le défi (score >= 20 dans tous les autres modes)
    if (isPongUnlocked() && !base.includes('pong_circulaire')) {
      base = [...base, 'pong_circulaire'];
    } else if (!isPongUnlocked()) {
      base = base.filter((m) => m !== 'pong_circulaire');
    }
    return base;
  });

  const { gameState, startGame, onTap, resetGame, cfg, spendCoins, addCoins, purchaseTheme } = useGameLogic(currentMode);
  const { removeBoost, addBoost } = useBoosts();
  const { toast } = useToast();
  const [currentCoins, setCurrentCoins] = useState(gameState.coins);
  const [ownedThemesState, setOwnedThemesState] = useState(gameState.ownedThemes);
  const { playClick, playSuccess, playFailure, isMuted, toggleMute } = useSound();
  
  // Synchroniser les coins et les thèmes depuis gameState
  useEffect(() => {
    setCurrentCoins(gameState.coins);
  }, [gameState.coins]);

  useEffect(() => {
    setOwnedThemesState(gameState.ownedThemes);
  }, [gameState.ownedThemes]);

  // Vérifier les récompenses disponibles au montage et initialiser les notifications
  useEffect(() => {
    resetDayIfNeeded();
    setHasAvailableReward(canClaimReward());
    
    // Initialiser les notifications une seule fois
    initNotifications();
  }, []);

  // Afficher la popup d'avis quand le joueur revient au menu
  useEffect(() => {
    if (currentScreen === 'menu' && pendingRateDialog) {
      setPendingRateDialog(false);
      setTimeout(() => setShowRateDialog(true), 800);
    }
  }, [currentScreen, pendingRateDialog]);

  const handleDailyRewardClaimed = (coins: number, theme?: string, boostId?: string) => {
    if (coins > 0) {
      addCoins(coins);
    }
    
    if (boostId) {
      addBoost(boostId as BoostType);
      toast({
        title: "🎁 Boost reçu !",
        description: `Tu as obtenu un boost gratuit !`,
      });
    }
    
    if (theme) {
      // Ajouter le thème aux possédés
      const currentOwnedThemes = gameState.ownedThemes;
      if (!currentOwnedThemes.includes(theme)) {
        const newOwnedThemes = [...currentOwnedThemes, theme];
        const gameData = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
        gameData.ownedThemes = newOwnedThemes;
        localStorage.setItem('luckyStopGame', JSON.stringify(gameData));
      }
      
      toast({
        title: "🎉 Récompense spéciale !",
        description: `Tu as débloqué le thème exclusif "Majesté Royale" !`,
      });
    }
    
    setHasAvailableReward(false);
  };

  // Soumission automatique à la fin d'une partie (pilotée par CircleTap via onGameOver)
  const handleGameOver = async (finalScore: number, gameDuration: number = 0) => {
    setLastGameScore(finalScore);
    
    // Mettre à jour la progression des défis quotidiens
    updateDailyChallengeProgress(currentMode, finalScore, gameDuration);
    
    // Season Pass: update quest score
    updateQuestScore(finalScore);
    
    // Consommer les boosts utilisés
    selectedBoostsForGame.forEach(boostId => {
      removeBoost(boostId);
    });
    setSelectedBoostsForGame([]);

    // Recharger les coins depuis localStorage (mis à jour par useGameLogic dans CircleTap)
    const saved = localStorage.getItem('luckyStopGame');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        setCurrentCoins(parsedState.coins || 0);
      } catch (e) {
        console.error('Error loading coins after game:', e);
      }
    }

    const identity = getLocalIdentity();

    if (identity.username) {
      import('@/utils/scoresApi').then(({ submitScore }) => {
        submitScore({ score: finalScore, mode: currentMode })
          .then(success => {
            // Soumission silencieuse - pas de notifications
          })
          .catch((error) => {
            // Erreurs silencieuses - pas de notifications
          });
      });
    } else {
      setShowUsernameModal(true);
    }

    // Vérifier si Pong Circulaire vient d'être débloqué
    if (isPongUnlocked() && !unlockedModes.includes('pong_circulaire')) {
      const newUnlocked = [...unlockedModes, 'pong_circulaire'];
      setUnlockedModes(newUnlocked);
      toast({
        title: '🎉 Mode débloqué !',
        description: 'Pong Circulaire est maintenant disponible !',
      });
    }

    // Rate dialog logic:
    // 1st trigger: score >30 in non-classic mode (if never triggered before)
    // 2nd trigger: score >=55 in non-classic mode (only if user dismissed first time)
    if (currentMode !== 'classic') {
      const rateData = JSON.parse(localStorage.getItem('ls_rate_app') || '{}');
      if (!rateData.rated) {
        const alreadyTriggered30 = localStorage.getItem('ls_rate_triggered_30');
        const alreadyTriggered55 = localStorage.getItem('ls_rate_triggered_55');

        if (!alreadyTriggered30 && finalScore > 30) {
          localStorage.setItem('ls_rate_triggered_30', 'true');
          setPendingRateDialog(true);
        } else if (alreadyTriggered30 && !alreadyTriggered55 && rateData.dismissed && finalScore >= 55) {
          localStorage.setItem('ls_rate_triggered_55', 'true');
          setPendingRateDialog(true);
        }
      }
    }

    // Afficher une interstitielle si toutes les conditions sont remplies
    import('@/ads/InterstitialService').then(({ Interstitials }) => {
      Interstitials.showInterstitialIfReady().catch(error => {
        console.log('Interstitial not shown:', error);
      });
    });
  };

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('currentTheme', theme);
    toast({
      title: "Thème équipé!",
      description: `Le thème a été équipé avec succès.`,
    });
  };

  const handleModeChange = (mode: ModeType, selectedBoosts?: BoostType[]) => {
    if (gameState.gameStatus === 'running') {
      toast({
        title: "Impossible de changer de mode",
        description: "Termine ta partie actuelle pour changer de mode.",
        variant: "destructive"
      });
      return;
    }

    // Vérifier si le mode est débloqué
    if (!unlockedModes.includes(mode)) {
      toast({
        title: "Mode verrouillé",
        description: "Débloquez ce mode dans la boutique !",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentMode(mode);
    localStorage.setItem('ls_mode', mode);
    
    // Season Pass: quête boost si des boosts sont sélectionnés au démarrage
    if (selectedBoosts && selectedBoosts.length > 0) {
      updateQuestBoostUsed();
    }
    
    // Définir les boosts sélectionnés et lancer le jeu
    setSelectedBoostsForGame(selectedBoosts || []);
    setCurrentScreen('game');
  };

  const handlePurchaseMode = (modeId: string, price: number): boolean => {
    if (spendCoins(price)) {
      const newUnlockedModes = [...unlockedModes, modeId];
      setUnlockedModes(newUnlockedModes);
      localStorage.setItem('unlockedModes', JSON.stringify(newUnlockedModes));
      
      toast({
        title: "Mode débloqué !",
        description: "Le nouveau mode de jeu est maintenant disponible.",
      });
      return true;
    } else {
      toast({
        title: "Coins insuffisants",
        description: `Il te faut ${price} coins pour débloquer ce mode.`,
        variant: "destructive"
      });
      return false;
    }
  };

  const handleBoostReward = (boost: BoostType) => {
    addBoost(boost);
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
            coins={currentCoins}
            theme={currentTheme}
            currentMode={currentMode}
            onStartGame={() => setCurrentScreen('modes')}
            onOpenShop={() => setCurrentScreen('shop')}
            onOpenChallenges={() => setCurrentScreen('challenges')}
            onOpenModes={() => setCurrentScreen('modes')}
            onOpenLeaderboard={() => setCurrentScreen('leaderboard')}
            onOpenDailyRewards={() => setShowDailyRewards(true)}
            onOpenGlobalLeaderboard={() => setCurrentScreen('global_leaderboard')}
            hasAvailableReward={hasAvailableReward}
            onAdRewardClaimed={addCoins}
            onSpendCoins={spendCoins}
            isSoundMuted={isMuted}
            onToggleSound={toggleMute}
            onOpenRateDialog={() => setShowRateDialog(true)}
            onOpenDailyChallenge={() => setCurrentScreen('daily_challenge')}
          />
        );
        
      case 'game':
          if (currentMode === 'pong_circulaire') {
            return (
              <PongCirculaire
                theme={currentTheme}
                onBack={() => setCurrentScreen('menu')}
                onGameOver={handleGameOver}
                isSoundMuted={isMuted}
                onToggleSound={toggleMute}
                playClick={playClick}
                playSuccess={playSuccess}
                playFailure={playFailure}
              />
            );
          }
          return (
            <CircleTap
              theme={currentTheme}
              currentMode={currentMode}
              onBack={() => setCurrentScreen('menu')}
              onGameOver={handleGameOver}
              selectedBoosts={selectedBoostsForGame}
              totalGamesPlayed={gameState.totalGamesPlayed}
              isSoundMuted={isMuted}
              onToggleSound={toggleMute}
              playClick={playClick}
              playSuccess={playSuccess}
              playFailure={playFailure}
              onBoostUsed={updateQuestBoostUsed}
            />
          );
        
      case 'shop':
        return (
          <Shop
            coins={currentCoins}
            ownedThemes={ownedThemesState}
            currentTheme={currentTheme}
            unlockedModes={unlockedModes}
            onBack={() => setCurrentScreen('menu')}
            onPurchaseTheme={(theme) => {
              const success = purchaseTheme(theme.id, theme.price);
              if (success) {
                // Forcer la mise à jour immédiate des thèmes
                setOwnedThemesState(prev => [...prev, theme.id]);
              }
              return success;
            }}
            onEquipTheme={handleThemeChange}
            onPurchaseMode={handlePurchaseMode}
            onSpendCoins={spendCoins}
            onAddCoins={addCoins}
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
            onBoostReward={handleBoostReward}
            onOpenDailyChallenge={() => setCurrentScreen('daily_challenge')}
          />
        );

        case 'modes':
          const savedData = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
          const bestScores = {
            classic: savedData[`bestScore_classic`] || 0,
            arc_changeant: savedData[`bestScore_arc_changeant`] || 0,
            survie_60s: savedData[`bestScore_survie_60s`] || 0,
            zone_mobile: savedData[`bestScore_zone_mobile`] || 0,
            zone_traitresse: savedData[`bestScore_zone_traitresse`] || 0,
            memoire_expert: savedData[`bestScore_memoire_expert`] || 0,
            pong_circulaire: savedData[`bestScore_pong_circulaire`] || 0,
          };
          
          return (
            <ModeSelection
              currentMode={currentMode}
              gameStatus={gameState.gameStatus}
              bestScores={bestScores}
              unlockedModes={unlockedModes}
              onSelectMode={handleModeChange}
              onBack={() => setCurrentScreen('menu')}
              onOpenShop={() => setCurrentScreen('shop')}
            />
          );
          
        case 'leaderboard':
          return (
            <OnlineLeaderboard
              onBack={() => setCurrentScreen('menu')}
            />
          );

        case 'daily_challenge':
          return (
            <DailyChallenge
              onBack={() => setCurrentScreen('menu')}
            />
          );
        
        case 'global_leaderboard':
          return (
            <GlobalLeaderboard
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
      
      {/* Modals */}
      <UsernameModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onUsernameSet={() => {
          setShowUsernameModal(false);
          // Auto-submit le score du dernier jeu si disponible
          // submitScore has built-in hasSubmittedThisGame guard — safe against double submit
          if (lastGameScore > 0) {
            import('@/utils/scoresApi').then(({ submitScore }) => {
              submitScore({ score: lastGameScore, mode: currentMode });
            });
          }
        }}
      />
      
      <SubmitScoreModal
        isOpen={showSubmitScoreModal}
        onClose={() => setShowSubmitScoreModal(false)}
        score={lastGameScore}
        mode={currentMode}
        onUsernameRequired={() => {
          setShowSubmitScoreModal(false);
          setShowUsernameModal(true);
        }}
      />

      <DailyRewards
        isOpen={showDailyRewards}
        onClose={() => setShowDailyRewards(false)}
        onRewardClaimed={handleDailyRewardClaimed}
      />

      <RateAppDialog
        isOpen={showRateDialog}
        onClose={() => setShowRateDialog(false)}
      />
    </div>
  );
};

export default Index;