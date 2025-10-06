import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { GameState } from '@/hooks/useGameLogic';

interface ScoreSyncProps {
  gameState: GameState;
  currentMode: string;
}

export const ScoreSync: React.FC<ScoreSyncProps> = ({ gameState, currentMode }) => {
  const { isAuthenticated, updateLeaderboard } = useAuth();
  const { addXp } = usePlayerLevel();

  useEffect(() => {
    // Add XP after game over - for ALL users (authenticated or not)
    if (
      gameState.gameStatus === 'gameover' && 
      gameState.currentScore > 0
    ) {
      const syncScore = async () => {
        try {
          // Update leaderboard if authenticated
          if (isAuthenticated) {
            await updateLeaderboard({
              mode: currentMode,
              score: gameState.bestScore,
              coins: gameState.coins,
              games_played: gameState.totalGamesPlayed,
              max_speed_reached: gameState.maxSpeedReached,
              direction_changes: gameState.directionChanges,
            });
          }

          // Add XP based on score (1 point = 1 XP) - works for all users
          await addXp(gameState.currentScore);
        } catch (error) {
          console.error('Error syncing score:', error);
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
    updateLeaderboard,
    addXp
  ]);

  return null; // This is a utility component with no UI
};