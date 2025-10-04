import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, X } from 'lucide-react';
import { AVAILABLE_BOOSTS, BoostInventory, BoostType } from '@/types/boosts';

interface PreGameMenuProps {
  inventory: BoostInventory;
  onStartGame: (selectedBoosts: BoostType[]) => void;
  onCancel: () => void;
}

export const PreGameMenu: React.FC<PreGameMenuProps> = ({
  inventory,
  onStartGame,
  onCancel,
}) => {
  const [selectedBoosts, setSelectedBoosts] = useState<BoostType[]>([]);

  const toggleBoost = (boostId: BoostType) => {
    if (selectedBoosts.includes(boostId)) {
      setSelectedBoosts(selectedBoosts.filter(id => id !== boostId));
    } else {
      // Maximum 3 boosts
      if (selectedBoosts.length < 3) {
        setSelectedBoosts([...selectedBoosts, boostId]);
      }
    }
  };

  const hasAnyBoosts = Object.values(inventory).some(count => count > 0);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <Card className="max-w-2xl w-full border-2 border-primary/30 bg-card/95 backdrop-blur-sm shadow-glow">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-4xl font-black text-primary mb-3 drop-shadow-glow">
              🎯 Prépare ta partie
            </h2>
            <p className="text-text-muted">
              {hasAnyBoosts 
                ? 'Sélectionne jusqu\'à 3 boosts pour cette partie'
                : 'Tu n\'as aucun boost pour le moment'}
            </p>
          </div>

          {/* Boosts Selection */}
          {hasAnyBoosts && (
            <div className="space-y-3">
              {AVAILABLE_BOOSTS.map((boost) => {
                const owned = inventory[boost.id];
                const isSelected = selectedBoosts.includes(boost.id);
                
                if (owned === 0) return null;

                return (
                  <button
                    key={boost.id}
                    onClick={() => toggleBoost(boost.id)}
                    disabled={!isSelected && selectedBoosts.length >= 3}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left
                      ${isSelected 
                        ? 'border-primary bg-primary/20 shadow-glow' 
                        : 'border-wheel-border/50 bg-card/50 hover:border-primary/50'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{boost.icon}</span>
                        <div>
                          <h3 className="font-bold text-lg text-primary">
                            {boost.name}
                          </h3>
                          <p className="text-sm text-text-muted">
                            {boost.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center px-3 py-1 bg-background/50 rounded-full">
                          <span className="text-xs text-text-muted">Possédé:</span>
                          <span className="ml-1 font-bold text-primary">{owned}</span>
                        </div>
                        {isSelected && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-white font-bold">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Count */}
          {hasAnyBoosts && (
            <div className="text-center text-sm text-text-muted">
              {selectedBoosts.length} / 3 boosts sélectionnés
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={onCancel}
              variant="outline"
              size="lg"
              className="flex-1 border-wheel-border hover:bg-button-hover"
            >
              <X className="w-5 h-5 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={() => onStartGame(selectedBoosts)}
              size="lg"
              className="flex-1 bg-gradient-to-r from-primary to-primary-glow hover:scale-105 transition-all duration-300 text-lg font-bold shadow-glow"
            >
              <Play className="w-5 h-5 mr-2" />
              COMMENCER LA PARTIE
            </Button>
          </div>

          {/* Hint */}
          <div className="text-center text-xs text-text-muted opacity-70">
            💡 Les boosts s'activeront automatiquement pendant la partie
          </div>
        </div>
      </Card>
    </div>
  );
};
