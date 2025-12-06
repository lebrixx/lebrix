import { useState, useEffect, useCallback } from 'react';
import { BoostType, BoostInventory } from '@/types/boosts';

const STORAGE_KEY = 'luckyStopBoosts';
const BOOSTS_UPDATE_EVENT = 'boostsInventoryUpdate';

// Helper to read from localStorage
const getStoredInventory = (): BoostInventory => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Helper to save to localStorage
const saveInventory = (inventory: BoostInventory) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  // Dispatch event to notify other instances
  window.dispatchEvent(new CustomEvent(BOOSTS_UPDATE_EVENT, { detail: inventory }));
};

export const useBoosts = () => {
  const [inventory, setInventory] = useState<BoostInventory>(getStoredInventory);

  // Listen for updates from other instances
  useEffect(() => {
    const handleUpdate = (e: CustomEvent<BoostInventory>) => {
      setInventory(e.detail);
    };

    // Also listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setInventory(JSON.parse(e.newValue));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener(BOOSTS_UPDATE_EVENT as any, handleUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener(BOOSTS_UPDATE_EVENT as any, handleUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addBoost = useCallback((boostId: BoostType) => {
    const current = getStoredInventory();
    const newInventory = {
      ...current,
      [boostId]: (current[boostId] || 0) + 1,
    };
    saveInventory(newInventory);
    setInventory(newInventory);
  }, []);

  const removeBoost = useCallback((boostId: BoostType) => {
    const current = getStoredInventory();
    const newInventory = {
      ...current,
      [boostId]: Math.max(0, (current[boostId] || 0) - 1),
    };
    saveInventory(newInventory);
    setInventory(newInventory);
  }, []);

  const getBoostCount = useCallback((boostId: BoostType): number => {
    return getStoredInventory()[boostId] || 0;
  }, []);

  const hasBoost = useCallback((boostId: BoostType): boolean => {
    return (getStoredInventory()[boostId] || 0) > 0;
  }, []);

  return {
    inventory,
    addBoost,
    removeBoost,
    getBoostCount,
    hasBoost,
  };
};
