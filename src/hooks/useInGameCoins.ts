import { useEffect, useRef, useState } from 'react';

/**
 * Hook partagé pour les modes 3D :
 * - Affiche un compteur de coins live à côté du score.
 * - Fait gagner 1 coin toutes les 3 secondes de jeu (uniquement quand `playing`).
 * - Se met en pause pendant les pubs / game over.
 */
export function useInGameCoins(
  initialCoins: number,
  playing: boolean,
  onEarnCoin?: (amount: number) => void,
) {
  const [displayCoins, setDisplayCoins] = useState(initialCoins);
  const baselineRef = useRef(initialCoins);

  // Resync quand la source externe change (récompenses, pub, etc.)
  useEffect(() => {
    baselineRef.current = initialCoins;
    setDisplayCoins((prev) => (prev < initialCoins ? initialCoins : prev));
  }, [initialCoins]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setDisplayCoins((c) => c + 1);
      onEarnCoin?.(1);
    }, 3000);
    return () => clearInterval(id);
  }, [playing, onEarnCoin]);

  return displayCoins;
}
