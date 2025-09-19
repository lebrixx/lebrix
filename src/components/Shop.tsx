import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, Coins, Lock, Palette, Circle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const availableItems = [
  // Arrière-plans
  { id: 'bg-space', name: 'Espace Étoilé', type: 'background' as const, preview: 'linear-gradient(135deg, #0a0a2e, #16213e)', price: 50, description: 'Galaxie infinie avec étoiles' },
  { id: 'bg-sunset', name: 'Coucher de Soleil', type: 'background' as const, preview: 'linear-gradient(135deg, #ff7e5f, #feb47b)', price: 50, description: 'Horizon doré et rose' },
  { id: 'bg-forest', name: 'Forêt Mystique', type: 'background' as const, preview: 'linear-gradient(135deg, #134e5e, #71b280)', price: 50, description: 'Forêt enchantée verte' },
  { id: 'bg-ocean', name: 'Profondeurs Marines', type: 'background' as const, preview: 'linear-gradient(135deg, #0c4a6e, #0891b2)', price: 75, description: 'Abysses bleu profond' },
  { id: 'bg-fire', name: 'Flammes Ardentes', type: 'background' as const, preview: 'linear-gradient(135deg, #dc2626, #fbbf24)', price: 75, description: 'Brasier rouge orange' },
  
  // Cercles
  { id: 'circle-neon', name: 'Néon Cyan', type: 'circle' as const, preview: '', color: '#00ffff', price: 30, description: 'Éclat cyber électrique' },
  { id: 'circle-fire', name: 'Feu Ardent', type: 'circle' as const, preview: '', color: '#ff4444', price: 30, description: 'Rouge flamboyant' },
  { id: 'circle-gold', name: 'Or Brillant', type: 'circle' as const, preview: '', color: '#ffd700', price: 35, description: 'Éclat doré luxueux' },
  { id: 'circle-emerald', name: 'Émeraude', type: 'circle' as const, preview: '', color: '#059669', price: 40, description: 'Vert émeraude mystique' },
  { id: 'circle-plasma', name: 'Plasma', type: 'circle' as const, preview: '', color: '#3b82f6', price: 45, description: 'Énergie bleu électrique' },
  
  // Effets
  { id: 'effect-glow', name: 'Lueur Rapide', type: 'effect' as const, preview: '', color: '#4ee1a0', price: 40, description: 'Pulsation accélérée' },
  { id: 'effect-rainbow', name: 'Arc-en-ciel', type: 'effect' as const, preview: '', color: '#ff6b6b', price: 50, description: 'Couleurs changeantes' },
  { id: 'effect-lightning', name: 'Éclairs', type: 'effect' as const, preview: '', color: '#60a5fa', price: 60, description: 'Éclairs sauvages' },
  { id: 'effect-pulse', name: 'Pulsation', type: 'effect' as const, preview: '', color: '#a855f7', price: 55, description: 'Battement hypnotique' },
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
      toast.success(`${item.name} acheté!`);
    } else {
      toast.error('Pas assez de coins!');
    }
  };

  const backgrounds = availableItems.filter(item => item.type === 'background');
  const circles = availableItems.filter(item => item.type === 'circle');
  const effects = availableItems.filter(item => item.type === 'effect');

  const renderItemCard = (item: any) => {
    const isOwned = ownedItems.find(owned => owned.id === item.id);
    const canAfford = coins >= item.price;

    return (
      <Card 
        key={item.id}
        className="bg-button-bg border-wheel-border p-4 hover:scale-105 transition-all duration-300 cursor-pointer animate-scale-in"
      >
        {/* Preview */}
        <div className="relative mb-3">
          {item.type === 'background' && (
            <div 
              className="w-full h-20 rounded-lg border-2 border-wheel-border"
              style={{ background: item.preview }}
            />
          )}
          
          {item.type === 'circle' && (
            <div className="w-full h-20 bg-game-dark rounded-lg border-2 border-wheel-border flex items-center justify-center">
              <div 
                className="w-16 h-16 rounded-full border-4"
                style={{ borderColor: item.color }}
              />
            </div>
          )}
          
          {item.type === 'effect' && (
            <div className="w-full h-20 bg-game-dark rounded-lg border-2 border-wheel-border flex items-center justify-center">
              <div 
                className="w-8 h-8 rounded-full animate-pulse"
                style={{ backgroundColor: item.color }}
              />
            </div>
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
            <Coins className="w-3 h-3 mr-1" />
            {item.price}
          </div>

          <Button
            onClick={() => handlePurchase(item)}
            size="sm"
            className={`
              w-full text-xs transition-all duration-300
              ${isOwned 
                ? 'bg-success hover:bg-success text-game-dark cursor-default' 
                : canAfford
                ? 'bg-gradient-primary hover:scale-105'
                : 'bg-button-bg border border-wheel-border text-text-muted cursor-not-allowed'
              }
            `}
            disabled={isOwned || !canAfford}
          >
            {isOwned ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                POSSÉDÉ
              </>
            ) : canAfford ? (
              'ACHETER'
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
          <h1 className="text-2xl font-bold text-primary mb-1">BOUTIQUE</h1>
          <div className="flex items-center text-secondary">
            <Coins className="w-4 h-4 mr-2" />
            {coins} Coins
          </div>
        </div>

        <div className="w-20"></div>
      </div>

      {/* Shop Tabs */}
      <Tabs defaultValue="backgrounds" className="max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 bg-button-bg border border-wheel-border">
          <TabsTrigger value="backgrounds" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Fonds
          </TabsTrigger>
          <TabsTrigger value="circles" className="flex items-center gap-2">
            <Circle className="w-4 h-4" />
            Cercles
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Effets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backgrounds" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {backgrounds.map((item) => renderItemCard(item))}
          </div>
        </TabsContent>

        <TabsContent value="circles" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {circles.map((item) => renderItemCard(item))}
          </div>
        </TabsContent>

        <TabsContent value="effects" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {effects.map((item) => renderItemCard(item))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <div className="text-center mt-6 text-text-muted animate-fade-in">
        <p className="text-sm">
          💡 Achetez vos éléments préférés puis personnalisez-les avant de jouer!
        </p>
      </div>
    </div>
  );
};