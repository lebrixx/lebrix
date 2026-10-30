import React, { useEffect, useState } from 'react';
import { Home, ShoppingBag, Box, Star, Trophy } from 'lucide-react';
import { hasPendingChallengeRewards } from '@/utils/challengeUtils';

export type BottomNavTab = 'menu' | 'shop' | 'inventory' | 'challenges' | 'leaderboard';

interface BottomNavProps {
  active: BottomNavTab;
  onSelect: (tab: BottomNavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ active, onSelect }) => {
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const check = () => setPending(hasPendingChallengeRewards());
    check();
    const id = window.setInterval(check, 5000);
    return () => window.clearInterval(id);
  }, []);

  const items: { id: BottomNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'menu', label: 'ACCUEIL', icon: <Home strokeWidth={1.8} /> },
    { id: 'shop', label: 'BOUTIQUE', icon: <ShoppingBag strokeWidth={1.8} /> },
    { id: 'inventory', label: 'INVENTAIRE', icon: <Box strokeWidth={1.8} /> },
    { id: 'challenges', label: 'DÉFIS', icon: <span className="relative"><Star strokeWidth={1.8} />{pending && <span className="lsm-badge lsm-badge-nav">!</span>}</span> },
    { id: 'leaderboard', label: 'CLASSEMENT', icon: <Trophy strokeWidth={1.8} /> },
  ];

  return (
    <nav className="lsm-nav lsm-nav-fixed">
      {items.map((it) => (
        <button key={it.id} type="button" className={`lsm-nav-item${active === it.id ? ' is-active' : ''}`} onClick={() => onSelect(it.id)}>
          {it.icon}<span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
};
