import { useState, useCallback, useEffect } from 'react';
import { BoostType, BoostInventory, ActiveBoosts } from '@/types/boosts';

const STORAGE_KEY = 'luckyStopBoosts';
const GAMES_PLAYED_KEY = 'luckyStopGamesCount';

export const useBoosts = () => {
  const [inventory, setInventory] = useState<BoostInventory>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading boost inventory:', e);
      }
    }
    return { shield: 0, slowdown: 0, start20: 0 };
  });

  const [gamesPlayed, setGamesPlayed] = useState<number>(() => {
    const saved = localStorage.getItem(GAMES_PLAYED_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  // Sauvegarder l'inventaire
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory]);

  // Sauvegarder le nombre de parties jouées
  useEffect(() => {
    localStorage.setItem(GAMES_PLAYED_KEY, gamesPlayed.toString());
  }, [gamesPlayed]);

  // Ajouter un boost à l'inventaire
  const addBoost = useCallback((boostType: BoostType, quantity: number = 1) => {
    setInventory(prev => ({
      ...prev,
      [boostType]: prev[boostType] + quantity,
    }));
  }, []);

  // Utiliser un boost (décrémenter l'inventaire)
  const useBoost = useCallback((boostType: BoostType): boolean => {
    if (inventory[boostType] > 0) {
      setInventory(prev => ({
        ...prev,
        [boostType]: prev[boostType] - 1,
      }));
      return true;
    }
    return false;
  }, [inventory]);

  // Vérifier si un boost est disponible
  const hasBoost = useCallback((boostType: BoostType): boolean => {
    return inventory[boostType] > 0;
  }, [inventory]);

  // Incrémenter le compteur de parties jouées
  const incrementGamesPlayed = useCallback(() => {
    setGamesPlayed(prev => prev + 1);
  }, []);

  // Vérifier si on peut afficher le bouton revivre (à partir de la 2ème partie)
  const canShowRevive = useCallback((): boolean => {
    return gamesPlayed >= 1;
  }, [gamesPlayed]);

  return {
    inventory,
    addBoost,
    useBoost,
    hasBoost,
    incrementGamesPlayed,
    canShowRevive,
    gamesPlayed,
  };
};
