import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, Coins, Lock, Palette, Circle, Sparkles, Crown, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';

const availableItems = [
  // Palettes de couleurs
  { id: 'palette-neon', name: 'Néon', type: 'background' as const, preview: 'linear-gradient(135deg, #00ffff, #ff00ff)', price: 0, description: 'Couleurs cyber électriques', color: '#00ffff', rarity: 'common' },
  { id: 'palette-sunset', name: 'Coucher de soleil', type: 'background' as const, preview: 'linear-gradient(135deg, #ff6b35, #f7931e)', price: 50, description: 'Horizon doré et rose', color: '#ff6b35', rarity: 'common' },
  { id: 'palette-ocean', name: 'Océan', type: 'background' as const, preview: 'linear-gradient(135deg, #0077be, #00a8cc)', price: 75, description: 'Abysses bleu profond', color: '#0077be', rarity: 'rare' },
  { id: 'palette-forest', name: 'Forêt', type: 'background' as const, preview: 'linear-gradient(135deg, #2d5a27, #76c893)', price: 75, description: 'Forêt enchantée verte', color: '#2d5a27', rarity: 'rare' },
  { id: 'palette-lava', name: 'Lave', type: 'background' as const, preview: 'linear-gradient(135deg, #ff4444, #cc2936)', price: 100, description: 'Brasier rouge orange', color: '#ff4444', rarity: 'epic' },
  { id: 'palette-arctic', name: 'Arctique', type: 'background' as const, preview: 'linear-gradient(135deg, #a8dadc, #f1faee)', price: 60, description: 'Glace cristalline', color: '#a8dadc', rarity: 'common' },
  { id: 'palette-cosmic', name: 'Cosmique', type: 'background' as const, preview: 'linear-gradient(135deg, #1a0533, #4c1d95)', price: 150, description: 'Nébuleuse galactique', color: '#4c1d95', rarity: 'legendary' },
  { id: 'palette-rainbow', name: 'Arc-en-ciel', type: 'background' as const, preview: 'linear-gradient(135deg, #ff0080, #00ff80)', price: 200, description: 'Spectre complet', color: '#ff0080', rarity: 'legendary' },
  
  // Cercles
  { id: 'circle-default', name: 'Défaut', type: 'circle' as const, preview: '', color: '#4ee1a0', price: 0, description: 'Cercle standard', rarity: 'common' },
  { id: 'circle-neon', name: 'Néon Cyan', type: 'circle' as const, preview: '', color: '#00ffff', price: 30, description: 'Éclat cyber électrique', rarity: 'common' },
  { id: 'circle-fire', name: 'Feu Ardent', type: 'circle' as const, preview: '', color: '#ff4444', price: 30, description: 'Rouge flamboyant', rarity: 'common' },
  { id: 'circle-gold', name: 'Or Brillant', type: 'circle' as const, preview: '', color: '#ffd700', price: 35, description: 'Éclat doré luxueux', rarity: 'rare' },
  { id: 'circle-emerald', name: 'Émeraude', type: 'circle' as const, preview: '', color: '#059669', price: 40, description: 'Vert émeraude mystique', rarity: 'rare' },
  { id: 'circle-plasma', name: 'Plasma', type: 'circle' as const, preview: '', color: '#3b82f6', price: 45, description: 'Énergie bleu électrique', rarity: 'rare' },
  { id: 'circle-shadow', name: 'Ombre', type: 'circle' as const, preview: '', color: '#1f2937', price: 80, description: 'Ténèbres profondes', rarity: 'epic' },
  { id: 'circle-diamond', name: 'Diamant', type: 'circle' as const, preview: '', color: '#e5e7eb', price: 120, description: 'Éclat cristallin pur', rarity: 'legendary' },
  
  // Effets
  { id: 'effect-default', name: 'Défaut', type: 'effect' as const, preview: '', color: '#4ee1a0', price: 0, description: 'Effet standard', rarity: 'common' },
  { id: 'effect-glow', name: 'Lueur Rapide', type: 'effect' as const, preview: '', color: '#4ee1a0', price: 40, description: 'Pulsation accélérée', rarity: 'common' },
  { id: 'effect-rainbow', name: 'Arc-en-ciel', type: 'effect' as const, preview: '', color: '#ff6b6b', price: 50, description: 'Couleurs changeantes', rarity: 'rare' },
  { id: 'effect-lightning', name: 'Éclairs', type: 'effect' as const, preview: '', color: '#60a5fa', price: 60, description: 'Éclairs sauvages', rarity: 'rare' },
  { id: 'effect-pulse', name: 'Pulsation', type: 'effect' as const, preview: '', color: '#a855f7', price: 55, description: 'Battement hypnotique', rarity: 'rare' },
  { id: 'effect-tornado', name: 'Tornado', type: 'effect' as const, preview: '', color: '#10b981', price: 90, description: 'Tourbillon énergique', rarity: 'epic' },
  { id: 'effect-cosmic', name: 'Cosmique', type: 'effect' as const, preview: '', color: '#8b5cf6', price: 150, description: 'Énergie stellaire', rarity: 'legendary' },
];

interface ShopProps {
  coins: number;
  ownedItems: any[];
  onBack: () => void;
  onPurchaseItem: (item: any) => boolean;
}

export const Shop: React.FC<ShopProps> = ({
  coins,
  ownedItems,
  onBack,
  onPurchaseItem,
}) => {
  const handlePurchase = (item: any) => {
    if (ownedItems.find(owned => owned.id === item.id)) {
      toast.error('Vous possédez déjà cet élément!');
      return;
    }

    if (onPurchaseItem(item)) {
      toast.success(`${item.name} acheté!`, {
        description: `Vous avez dépensé ${item.price} coins`,
      });
    } else {
      toast.error('Pas assez de coins!', {
        description: `Il vous manque ${item.price - coins} coins`,
      });
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-400/30';
      case 'rare': return 'text-blue-400 border-blue-400/30';
      case 'epic': return 'text-purple-400 border-purple-400/30';
      case 'legendary': return 'text-yellow-400 border-yellow-400/30';
      default: return 'text-gray-400 border-gray-400/30';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'rare': return <Zap className="w-3 h-3" />;
      case 'epic': return <Crown className="w-3 h-3" />;
      case 'legendary': return <Star className="w-3 h-3" />;
      default: return null;
    }
  };

  const backgrounds = availableItems.filter(item => item.type === 'background');
  const circles = availableItems.filter(item => item.type === 'circle');
  const effects = availableItems.filter(item => item.type === 'effect');

  const renderItemCard = (item: any) => {
    const isOwned = ownedItems.find(owned => owned.id === item.id);
    const canAfford = coins >= item.price;
    const isFree = item.price === 0;

    return (
      <Card 
        key={item.id}
        className={`
          bg-button-bg border-wheel-border p-4 hover:scale-105 transition-all duration-300 cursor-pointer animate-scale-in
          ${isOwned ? 'border-success shadow-glow-success' : ''}
          ${item.rarity === 'rare' ? 'shadow-blue-500/20' : ''}
          ${item.rarity === 'epic' ? 'shadow-purple-500/20' : ''}
          ${item.rarity === 'legendary' ? 'shadow-yellow-500/20' : ''}
        `}
      >
        {/* Preview */}
        <div className="relative mb-3">
          {item.type === 'background' && (
            <div 
              className={`
                w-full h-20 rounded-lg border-2 border-wheel-border
                ${item.rarity === 'legendary' ? 'animate-pulse' : ''}
              `}
              style={{ background: item.preview }}
            />
          )}
          
          {item.type === 'circle' && (
            <div className="w-full h-20 bg-game-dark rounded-lg border-2 border-wheel-border flex items-center justify-center">
              <div 
                className={`
                  w-16 h-16 rounded-full border-4
                  ${item.rarity === 'legendary' ? 'animate-spin' : item.rarity === 'epic' ? 'animate-pulse' : ''}
                `}
                style={{ borderColor: item.color }}
              />
            </div>
          )}
          
          {item.type === 'effect' && (
            <div className="w-full h-20 bg-game-dark rounded-lg border-2 border-wheel-border flex items-center justify-center">
              <div 
                className={`
                  w-8 h-8 rounded-full
                  ${item.rarity === 'legendary' ? 'animate-bounce' : 'animate-pulse'}
                `}
                style={{ backgroundColor: item.color }}
              />
            </div>
          )}
          
          {/* Rarity Badge */}
          {item.rarity !== 'common' && (
            <Badge className={`absolute -top-2 -left-2 ${getRarityColor(item.rarity)}`}>
              {getRarityIcon(item.rarity)}
              {item.rarity.toUpperCase()}
            </Badge>
          )}
          
          {/* Status Badge */}
          {isOwned && (
            <Badge className="absolute -top-2 -right-2 bg-success text-game-dark">
              <Check className="w-3 h-3 mr-1" />
              POSSÉDÉ
            </Badge>
          )}
        </div>

        {/* Item Info */}
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-primary mb-1">{item.name}</h3>
          <p className="text-text-muted text-xs">{item.description}</p>
        </div>

        {/* Price and Action */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2 text-secondary text-sm">
            {isFree ? (
              <span className="text-success">GRATUIT</span>
            ) : (
              <>
                <Coins className="w-3 h-3 mr-1" />
                {item.price}
              </>
            )}
          </div>

          <Button
            onClick={() => handlePurchase(item)}
            size="sm"
            className={`
              w-full text-xs transition-all duration-300
              ${isOwned 
                ? 'bg-success hover:bg-success text-game-dark cursor-default' 
                : canAfford || isFree
                ? 'bg-gradient-primary hover:scale-105'
                : 'bg-button-bg border border-wheel-border text-text-muted cursor-not-allowed'
              }
            `}
            disabled={isOwned || (!canAfford && !isFree)}
          >
            {isOwned ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                POSSÉDÉ
              </>
            ) : (canAfford || isFree) ? (
              isFree ? 'RÉCUPÉRER' : 'ACHETER'
            ) : (
              <>
                <Lock className="w-3 h-3 mr-1" />
                VERROUILLÉ
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-game p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <Button 
          onClick={onBack}
          variant="outline"
          className="border-wheel-border hover:bg-button-hover"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </Button>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-1">🛍️ BOUTIQUE PREMIUM</h1>
          <div className="flex items-center justify-center text-secondary">
            <Coins className="w-4 h-4 mr-2" />
            <span className="text-xl font-bold">{coins}</span>
            <span className="ml-1">Coins</span>
          </div>
        </div>

        <div className="w-20"></div>
      </div>

      {/* Shop Tabs */}
      <Tabs defaultValue="backgrounds" className="max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 bg-button-bg border border-wheel-border">
          <TabsTrigger value="backgrounds" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Palettes ({backgrounds.length})
          </TabsTrigger>
          <TabsTrigger value="circles" className="flex items-center gap-2">
            <Circle className="w-4 h-4" />
            Cercles ({circles.length})
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Effets ({effects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backgrounds" className="mt-6">
          <div className="mb-4 text-center text-text-muted">
            <p>🎨 Transformez votre jeu avec des palettes de couleurs uniques!</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {backgrounds.map((item) => renderItemCard(item))}
          </div>
        </TabsContent>

        <TabsContent value="circles" className="mt-6">
          <div className="mb-4 text-center text-text-muted">
            <p>⭕ Personnalisez la zone de succès avec style!</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {circles.map((item) => renderItemCard(item))}
          </div>
        </TabsContent>

        <TabsContent value="effects" className="mt-6">
          <div className="mb-4 text-center text-text-muted">
            <p>✨ Ajoutez des effets visuels époustouflants!</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {effects.map((item) => renderItemCard(item))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Rarity Legend */}
      <div className="max-w-4xl mx-auto mt-8 p-4 bg-button-bg/50 border border-wheel-border rounded-lg animate-fade-in">
        <h3 className="text-lg font-bold text-primary mb-3 text-center">Légende des Raretés</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span className="text-xs">COMMUN</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-blue-400">
            <Zap className="w-3 h-3" />
            <span className="text-xs">RARE</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-purple-400">
            <Crown className="w-3 h-3" />
            <span className="text-xs">ÉPIQUE</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <Star className="w-3 h-3" />
            <span className="text-xs">LÉGENDAIRE</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="text-center mt-6 text-text-muted animate-fade-in">
        <p className="text-sm">
          💡 Gagnez des coins en jouant et complétez des défis pour débloquer plus d'éléments!
        </p>
      </div>
    </div>
  );
};