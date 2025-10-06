import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PlayerLevel {
  level: number;
  current_xp: number;
  total_xp: number;
}

const STORAGE_KEY = 'lucky_stop_player_level';

// Calculate XP needed for next level using same formula as backend
const calculateXpForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.8));
};

// Load level from localStorage
const loadLocalLevel = (): PlayerLevel => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { level: 1, current_xp: 0, total_xp: 0 };
    }
  }
  return { level: 1, current_xp: 0, total_xp: 0 };
};

// Save level to localStorage
const saveLocalLevel = (level: PlayerLevel) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(level));
};

export const usePlayerLevel = () => {
  const { isAuthenticated, user } = useAuth();
  const [playerLevel, setPlayerLevel] = useState<PlayerLevel>(loadLocalLevel());

  // Load level from DB if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const fetchLevel = async () => {
        const { data } = await supabase
          .from('player_levels')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          const dbLevel = {
            level: data.level,
            current_xp: Number(data.current_xp),
            total_xp: Number(data.total_xp)
          };
          setPlayerLevel(dbLevel);
          saveLocalLevel(dbLevel); // Sync to localStorage
        }
      };

      fetchLevel();
    }
  }, [isAuthenticated, user]);

  // Add XP function
  const addXp = async (xpAmount: number) => {
    let newLevel = playerLevel.level;
    let newCurrentXp = playerLevel.current_xp + xpAmount;
    let newTotalXp = playerLevel.total_xp + xpAmount;
    let leveledUp = false;

    // Level up loop
    while (newLevel < 100) {
      const xpNeeded = calculateXpForLevel(newLevel);
      
      if (newCurrentXp >= xpNeeded) {
        newCurrentXp -= xpNeeded;
        newLevel += 1;
        leveledUp = true;
      } else {
        break;
      }
    }

    // Cap at level 100
    if (newLevel >= 100) {
      newLevel = 100;
      newCurrentXp = 0;
    }

    const updatedLevel: PlayerLevel = {
      level: newLevel,
      current_xp: newCurrentXp,
      total_xp: newTotalXp
    };

    // Update local state and storage
    setPlayerLevel(updatedLevel);
    saveLocalLevel(updatedLevel);

    // Sync to DB if authenticated
    if (isAuthenticated && user?.id) {
      try {
        await supabase.rpc('add_player_xp', {
          p_user_id: user.id,
          xp_gained: xpAmount
        });
      } catch (error) {
        console.error('Error syncing XP to database:', error);
      }
    }

    return { leveled_up: leveledUp, new_level: newLevel };
  };

  return {
    playerLevel,
    addXp,
    calculateXpForLevel
  };
};
