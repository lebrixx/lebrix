import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ShopProps {
  coins: number;
  onBack: () => void;
}

export const Shop: React.FC<ShopProps> = ({ coins, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-game flex flex-col items-center justify-center p-4">
      <Button onClick={onBack} variant="outline" className="absolute top-4 left-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>
      
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">BOUTIQUE</h1>
        <p className="text-text-secondary">Coins: {coins}</p>
        <p className="text-text-muted mt-4">Boutique en construction...</p>
      </div>
    </div>
  );
};