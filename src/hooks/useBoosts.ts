import { useState, useEffect } from 'react';
import { BoostType, BoostInventory } from '@/types/boosts';

const STORAGE_KEY = 'luckyStopBoosts';

export const useBoosts = () => {
  const [inventory, setInventory] = useState<BoostInventory>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory]);

  const addBoost = (boostId: BoostType) => {
    setInventory(prev => ({
      ...prev,
      [boostId]: (prev[boostId] || 0) + 1,
    }));
  };

  const removeBoost = (boostId: BoostType) => {
    setInventory(prev => ({
      ...prev,
      [boostId]: Math.max(0, (prev[boostId] || 0) - 1),
    }));
  };

  const getBoostCount = (boostId: BoostType): number => {
    return inventory[boostId] || 0;
  };

  const hasBoost = (boostId: BoostType): boolean => {
    return (inventory[boostId] || 0) > 0;
  };

  return {
    inventory,
    addBoost,
    removeBoost,
    getBoostCount,
    hasBoost,
  };
};
