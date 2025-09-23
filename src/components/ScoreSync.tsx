import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GameState } from '@/hooks/useGameLogic';
import { logger } from '@/utils/logger';

interface ScoreSyncProps {
  gameState: GameState;
  currentMode: string;
}

export const ScoreSync: React.FC<ScoreSyncProps> = ({ gameState, currentMode }) => {
  const { isAuthenticated, updateLeaderboard } = useAuth();

  useEffect(() => {
    // Sync scores when game ends and user is authenticated
    if (
      isAuthenticated && 
      gameState.gameStatus === 'gameover' && 
      gameState.currentScore > 0
    ) {
      const syncScore = async () => {
        try {
          await updateLeaderboard({
            mode: currentMode,
            score: gameState.bestScore,
            coins: gameState.coins,
            games_played: gameState.totalGamesPlayed,
            max_speed_reached: gameState.maxSpeedReached,
            direction_changes: gameState.directionChanges,
          });
        } catch (error) {
          logger.error('Error syncing score to leaderboard:', error);
        }
      };
      
      // Delay sync slightly to avoid race conditions
      setTimeout(syncScore, 1000);
    }
  }, [
    gameState.gameStatus, 
    gameState.currentScore, 
    gameState.bestScore,
    gameState.coins,
    gameState.totalGamesPlayed,
    gameState.maxSpeedReached,
    gameState.directionChanges,
    currentMode, 
    isAuthenticated, 
    updateLeaderboard
  ]);

  return null; // This is a utility component with no UI
};