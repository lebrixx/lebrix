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
          console.log('🎮 Game over! Adding XP:', gameState.currentScore);
          
          // Add XP based on score (1 point = 1 XP) - works for all users
          const result = await addXp(gameState.currentScore);
          console.log('✅ XP added successfully:', result);

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
        } catch (error) {
          console.error('❌ Error syncing score:', error);
        }
      };
      
      // Execute immediately
      syncScore();
    }
  }, [gameState.gameStatus]);

  return null; // This is a utility component with no UI
};