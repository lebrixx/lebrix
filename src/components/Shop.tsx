import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Coins, Palette, Star, Crown, Zap, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { THEMES } from '@/constants/themes';

const availableThemes = THEMES;

interface ShopProps {
  coins: number;
  ownedThemes: string[];
  currentTheme: string;
  onBack: () => void;
  onPurchaseTheme: (theme: any) => boolean;
  onEquipTheme: (themeId: string) => void;
}

export const Shop: React.FC<ShopProps> = ({
  coins,
  ownedThemes,
  currentTheme,
  onBack,
  onPurchaseTheme,
  onEquipTheme,
}) => {
  const handlePurchase = (theme: any) => {
    if (ownedThemes.includes(theme.id)) {
      toast.message('Thème déjà possédé', { description: 'Équipement automatique...' });
      onEquipTheme(theme.id);
      return;
    }

    const success = onPurchaseTheme(theme);
    if (success) {
      toast.success('Thème acheté!', { 
        description: `${theme.name} a été acheté et équipé automatiquement.`
      });
      onEquipTheme(theme.id);
    } else {
      toast.error('Pas assez de coins', { 
        description: `Il vous faut ${theme.price} coins pour acheter ce thème.`
      });
    }
  };

  const getDifficultyIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Palette className="w-5 h-5" />;
      case 'rare': return <Star className="w-5 h-5" />;
      case 'epic': return <Crown className="w-5 h-5" />;
      case 'legendary': return <Sparkles className="w-5 h-5" />;
      default: return <Palette className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const isOwned = (themeId: string) => ownedThemes.includes(themeId);
  const isEquipped = (themeId: string) => currentTheme === themeId;

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          onClick={onBack}
          variant="outline"
          className="border-wheel-border hover:bg-button-hover"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au Menu
        </Button>
        
        <div className="flex items-center gap-2 bg-button-bg border border-wheel-border rounded-lg px-4 py-2">
          <Coins className="w-5 h-5 text-secondary" />
          <span className="text-secondary font-bold text-lg">{coins}</span>
          <span className="text-text-muted">coins</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
          BOUTIQUE THÉMATIQUE
        </h1>
        <p className="text-text-secondary text-lg">
          Personnalisez votre expérience de jeu avec des thèmes uniques
        </p>
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {availableThemes.map((theme) => {
          const owned = isOwned(theme.id);
          const equipped = isEquipped(theme.id);
          
          return (
            <Card 
              key={theme.id}
              className={`
                relative overflow-hidden border-2 transition-all duration-300 hover:scale-105
                ${equipped 
                  ? 'border-primary bg-primary/5 shadow-glow-primary' 
                  : owned 
                    ? 'border-success bg-success/5' 
                    : 'border-wheel-border bg-button-bg hover:border-primary/50'
                }
              `}
            >
              {/* Theme Preview */}
              <div 
                className="h-32 relative"
                style={{ 
                  background: theme.preview.background,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/30" />
                
                {/* Equipped Badge */}
                {equipped && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-game-dark">
                      <Check className="w-3 h-3 mr-1" />
                      Équipé
                    </Badge>
                  </div>
                )}
                
                {/* Owned Badge */}
                {owned && !equipped && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-success text-game-dark">
                      <Check className="w-3 h-3 mr-1" />
                      Possédé
                    </Badge>
                  </div>
                )}
                
                {/* Tier Badge */}
                <div className="absolute top-2 left-2">
                  <Badge 
                    variant="outline" 
                    className={`${getDifficultyColor(theme.rarity)} border-current`}
                  >
                    {getDifficultyIcon(theme.rarity)}
                    <span className="ml-1 capitalize">{theme.rarity}</span>
                  </Badge>
                </div>

                {/* Mini Preview Circle */}
                <div className="absolute bottom-4 left-4">
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-white/50"
                    style={{ 
                      background: `conic-gradient(${theme.preview.successZone} 0deg 60deg, transparent 60deg 360deg)` 
                    }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full absolute top-1 left-1/2 transform -translate-x-1/2"
                      style={{ background: theme.preview.circle }}
                    />
                  </div>
                </div>
              </div>

              {/* Theme Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-text-primary">{theme.name}</h3>
                  <div className="flex items-center gap-1 text-secondary">
                    <Coins className="w-4 h-4" />
                    <span className="font-bold">{theme.price}</span>
                  </div>
                </div>
                
                <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                  {theme.description}
                </p>

                {/* Action Button */}
                <div className="space-y-2">
                  {equipped ? (
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90" 
                      disabled
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Thème Actuel
                    </Button>
                  ) : owned ? (
                    <Button 
                      onClick={() => onEquipTheme(theme.id)}
                      className="w-full bg-success hover:bg-success/90"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Équiper
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handlePurchase(theme)}
                      className="w-full bg-gradient-primary hover:scale-105 transition-all duration-300"
                      disabled={coins < theme.price}
                    >
                      <Coins className="w-4 h-4 mr-2" />
                      Acheter ({theme.price} coins)
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="text-center mt-8 text-text-muted">
        <p>Gagnez des coins en jouant pour débloquer de nouveaux thèmes !</p>
      </div>
    </div>
  );
};