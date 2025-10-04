import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, X } from 'lucide-react';
import { BOOSTS, BoostType } from '@/types/boosts';
import { useBoosts } from '@/hooks/useBoosts';

interface PostGameBoostMenuProps {
  onStartGame: (selectedBoosts: BoostType[]) => void;
  onCancel: () => void;
}

export const PostGameBoostMenu: React.FC<PostGameBoostMenuProps> = ({ onStartGame, onCancel }) => {
  const { getBoostCount } = useBoosts();
  const [selectedBoosts, setSelectedBoosts] = useState<BoostType[]>([]);

  const availableBoosts = Object.values(BOOSTS).filter(boost => 
    getBoostCount(boost.id) > 0
  );

  const toggleBoost = (boostId: BoostType) => {
    setSelectedBoosts(prev => 
      prev.includes(boostId)
        ? prev.filter(id => id !== boostId)
        : [...prev, boostId]
    );
  };

  const handleStart = () => {
    onStartGame(selectedBoosts);
  };

  return (
    <div className="fixed inset-0 bg-game-dark/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-button-bg border-wheel-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">
            Boosts disponibles
          </h2>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="icon"
            className="hover:bg-button-hover"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {availableBoosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary mb-4">
              Tu n'as pas de boosts disponibles
            </p>
            <p className="text-text-muted text-sm">
              Achète des boosts dans la boutique pour les utiliser !
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              <p className="text-text-secondary text-sm mb-4">
                Sélectionne les boosts pour ta prochaine partie :
              </p>
              {availableBoosts.map(boost => {
                const isSelected = selectedBoosts.includes(boost.id);
                const count = getBoostCount(boost.id);
                
                return (
                  <Card
                    key={boost.id}
                    onClick={() => toggleBoost(boost.id)}
                    className={`
                      p-4 cursor-pointer transition-all duration-300 hover:scale-105
                      ${isSelected 
                        ? 'bg-primary/20 border-primary border-2' 
                        : 'bg-wheel-segment/20 border-wheel-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{boost.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-text-primary font-bold">
                            {boost.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            x{count}
                          </Badge>
                        </div>
                        <p className="text-text-secondary text-sm">
                          {boost.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-game-dark" />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            <Button
              onClick={handleStart}
              className="w-full bg-gradient-primary hover:scale-105 transition-all duration-300 py-6 text-lg font-bold"
            >
              <Play className="w-5 h-5 mr-2" />
              RELANCER LA PARTIE
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};
