import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Coins, Play } from 'lucide-react';
import { AVAILABLE_BOOSTS, BoostInventory } from '@/types/boosts';

interface BoostShopProps {
  coins: number;
  inventory: BoostInventory;
  onBack: () => void;
  onPurchaseWithCoins: (boostId: string, price: number) => boolean;
  onPurchaseWithAd: (boostId: string) => void;
}

export const BoostShop: React.FC<BoostShopProps> = ({
  coins,
  inventory,
  onBack,
  onPurchaseWithCoins,
  onPurchaseWithAd,
}) => {
  // Placeholder pour vérifier si une pub est disponible (à connecter avec AdMob plus tard)
  const isAdAvailable = false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-wheel-border hover:bg-button-hover"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center gap-2 px-6 py-3 bg-card/80 backdrop-blur-sm rounded-full border-2 border-primary/20 shadow-glow">
            <Coins className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg text-primary">{coins}</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-black text-primary mb-4 drop-shadow-glow">
            Boutique des Boosts
          </h1>
          <p className="text-text-muted text-lg">
            Améliore tes performances avec des boosts puissants
          </p>
        </div>

        {/* Boosts Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {AVAILABLE_BOOSTS.map((boost) => {
            const owned = inventory[boost.id];
            const canAfford = coins >= boost.price;

            return (
              <Card
                key={boost.id}
                className="relative overflow-hidden border-2 border-wheel-border/50 bg-card/90 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
              >
                <div className="p-6 space-y-4">
                  {/* Icon & Name */}
                  <div className="text-center">
                    <div className="text-6xl mb-3 animate-float">
                      {boost.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-primary mb-2">
                      {boost.name}
                    </h3>
                    <p className="text-sm text-text-muted min-h-[3rem]">
                      {boost.description}
                    </p>
                  </div>

                  {/* Owned Count */}
                  <div className="flex items-center justify-center gap-2 py-2 px-4 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="text-sm font-semibold text-text-secondary">
                      Possédé:
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {owned}
                    </span>
                  </div>

                  {/* Purchase Buttons */}
                  <div className="space-y-3">
                    {/* Buy with Coins */}
                    <Button
                      onClick={() => onPurchaseWithCoins(boost.id, boost.price)}
                      disabled={!canAfford}
                      className="w-full bg-gradient-to-r from-primary to-primary-glow hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      <Coins className="w-4 h-4 mr-2" />
                      Acheter ({boost.price} coins)
                    </Button>

                    {/* Get with Ad */}
                    <Button
                      onClick={() => onPurchaseWithAd(boost.id)}
                      disabled={!isAdAvailable}
                      variant="outline"
                      className="w-full border-2 border-primary/50 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isAdAvailable ? 'Regarder une pub' : 'Pub non disponible'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-text-muted text-sm animate-fade-in">
          <p>💡 Les boosts se consomment lors de leur utilisation en partie</p>
          <p className="mt-2 text-xs opacity-70">
            La connexion AdMob sera activée prochainement
          </p>
        </div>
      </div>
    </div>
  );
};
