import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, Coins, Lock, Palette, Circle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  className: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface ShopProps {
  coins: number;
  onBack: () => void;
  onPurchase: (cost: number) => boolean;
  currentTheme?: string;
  onThemeChange?: (theme: string) => void;
}

// FONDS D'ÉCRAN
const BACKGROUNDS: ShopItem[] = [
  {
    id: 'bg-neon',
    name: 'Néon Gradient',
    price: 0,
    description: 'Dégradé néon classique',
    className: 'bg-neon',
    colors: { primary: '#00FFFF', secondary: '#FF00FF', accent: '#00FF00' },
  },
  {
    id: 'bg-space',
    name: 'Espace Étoilé',
    price: 30,
    description: 'Galaxie infinie avec étoiles',
    className: 'bg-space',
    colors: { primary: '#1e1b4b', secondary: '#312e81', accent: '#ffffff' },
  },
  {
    id: 'bg-fire',
    name: 'Flammes Ardentes',
    price: 50,
    description: 'Brasier rouge orange',
    className: 'bg-fire',
    colors: { primary: '#dc2626', secondary: '#ea580c', accent: '#fbbf24' },
  },
  {
    id: 'bg-ocean',
    name: 'Profondeurs Marines',
    price: 75,
    description: 'Abysses bleu profond',
    className: 'bg-ocean',
    colors: { primary: '#0c4a6e', secondary: '#0369a1', accent: '#0891b2' },
  },
  {
    id: 'bg-aurora',
    name: 'Aurore Boréale',
    price: 100,
    description: 'Lumières dansantes du nord',
    className: 'bg-aurora',
    colors: { primary: '#059669', secondary: '#0d9488', accent: '#06b6d4' },
  },
  {
    id: 'bg-sunset',
    name: 'Coucher de Soleil',
    price: 125,
    description: 'Horizon doré et rose',
    className: 'bg-sunset',
    colors: { primary: '#f59e0b', secondary: '#ef4444', accent: '#ec4899' },
  },
];

// COULEURS DE CERCLE
const CIRCLE_COLORS: ShopItem[] = [
  {
    id: 'circle-silver',
    name: 'Argent Classique',
    price: 0,
    description: 'Anneau argent standard',
    className: 'circle-silver',
    colors: { primary: '#e5e7eb', secondary: '#d1d5db', accent: '#f3f4f6' },
  },
  {
    id: 'circle-gold',
    name: 'Or Brillant',
    price: 25,
    description: 'Éclat doré luxueux',
    className: 'circle-gold',
    colors: { primary: '#fbbf24', secondary: '#f59e0b', accent: '#fde047' },
  },
  {
    id: 'circle-plasma',
    name: 'Plasma Électrique',
    price: 40,
    description: 'Énergie bleu électrique',
    className: 'circle-plasma',
    colors: { primary: '#3b82f6', secondary: '#1d4ed8', accent: '#60a5fa' },
  },
  {
    id: 'circle-ruby',
    name: 'Rubis Sanglant',
    price: 60,
    description: 'Rouge cristallin intense',
    className: 'circle-ruby',
    colors: { primary: '#dc2626', secondary: '#b91c1c', accent: '#f87171' },
  },
  {
    id: 'circle-emerald',
    name: 'Émeraude Mystique',
    price: 80,
    description: 'Vert émeraude brillant',
    className: 'circle-emerald',
    colors: { primary: '#059669', secondary: '#047857', accent: '#34d399' },
  },
  {
    id: 'circle-diamond',
    name: 'Diamant Prismatique',
    price: 150,
    description: 'Cristal arc-en-ciel',
    className: 'circle-diamond',
    colors: { primary: '#f8fafc', secondary: '#e2e8f0', accent: '#cbd5e1' },
  },
];

// EFFETS SPÉCIAUX
const SPECIAL_EFFECTS: ShopItem[] = [
  {
    id: 'effect-none',
    name: 'Aucun Effet',
    price: 0,
    description: 'Style minimaliste',
    className: 'effect-none',
  },
  {
    id: 'effect-glow',
    name: 'Lueur Magique',
    price: 35,
    description: 'Aura lumineuse autour du cercle',
    className: 'effect-glow',
  },
  {
    id: 'effect-particles',
    name: 'Particules Cosmiques',
    price: 55,
    description: 'Particules flottantes',
    className: 'effect-particles',
  },
  {
    id: 'effect-lightning',
    name: 'Éclairs Sauvages',
    price: 75,
    description: 'Éclairs qui dansent',
    className: 'effect-lightning',
  },
  {
    id: 'effect-pulse',
    name: 'Pulsation Rythmée',
    price: 90,
    description: 'Battement hypnotique',
    className: 'effect-pulse',
  },
];

export const Shop: React.FC<ShopProps> = ({ 
  coins, 
  onBack, 
  onPurchase,
  currentTheme = '',
  onThemeChange = () => {}
}) => {
  const [ownedItems, setOwnedItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('luckyStopOwnedItems');
    return saved ? JSON.parse(saved) : ['bg-neon', 'circle-silver', 'effect-none'];
  });

  const [currentBg, setCurrentBg] = useState('bg-neon');
  const [currentCircle, setCurrentCircle] = useState('circle-silver');
  const [currentEffect, setCurrentEffect] = useState('effect-none');

  useEffect(() => {
    localStorage.setItem('luckyStopOwnedItems', JSON.stringify(ownedItems));
  }, [ownedItems]);

  const handleBuyItem = (item: ShopItem, category: 'bg' | 'circle' | 'effect') => {
    if (ownedItems.includes(item.id)) {
      // Déjà possédé, l'équiper
      if (category === 'bg') setCurrentBg(item.id);
      else if (category === 'circle') setCurrentCircle(item.id);
      else if (category === 'effect') setCurrentEffect(item.id);
      
      toast.success(`${item.name} équipé!`);
      return;
    }

    if (onPurchase(item.price)) {
      setOwnedItems(prev => [...prev, item.id]);
      
      if (category === 'bg') setCurrentBg(item.id);
      else if (category === 'circle') setCurrentCircle(item.id);
      else if (category === 'effect') setCurrentEffect(item.id);
      
      toast.success(`${item.name} acheté et équipé!`);
    } else {
      toast.error(`Pas assez de coins! Vous avez besoin de ${item.price} coins.`);
    }
  };

  const renderItemCard = (item: ShopItem, category: 'bg' | 'circle' | 'effect') => {
    const isOwned = ownedItems.includes(item.id);
    const isCurrent = (category === 'bg' && currentBg === item.id) ||
                      (category === 'circle' && currentCircle === item.id) ||
                      (category === 'effect' && currentEffect === item.id);
    const canAfford = coins >= item.price;

    return (
      <Card 
        key={item.id}
        className="bg-button-bg border-wheel-border p-4 hover:scale-105 transition-all duration-300 cursor-pointer animate-scale-in"
      >
        {/* Preview */}
        <div className="relative mb-3">
          <div 
            className="w-full h-20 rounded-lg border-2 border-wheel-border relative overflow-hidden"
            style={{
              background: item.colors 
                ? `linear-gradient(135deg, ${item.colors.primary}, ${item.colors.secondary})`
                : 'linear-gradient(135deg, #374151, #4b5563)',
            }}
          >
            {/* Mini preview circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-white/40 rounded-full flex items-center justify-center">
              {category === 'circle' && (
                <div 
                  className="w-8 h-8 rounded-full border-2"
                  style={{ borderColor: item.colors?.primary || '#e5e7eb' }}
                />
              )}
              {category === 'effect' && <Sparkles className="w-4 h-4 text-white/60" />}
              {category === 'bg' && <div className="w-2 h-2 bg-white/60 rounded-full" />}
            </div>
          </div>
          
          {/* Status Badge */}
          {isCurrent && (
            <Badge className="absolute -top-2 -right-2 bg-success text-game-dark">
              <Check className="w-3 h-3 mr-1" />
              ÉQUIPÉ
            </Badge>
          )}
          
          {isOwned && !isCurrent && (
            <Badge variant="outline" className="absolute -top-2 -right-2 border-primary text-primary">
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
          {item.price === 0 ? (
            <Badge variant="secondary" className="mb-2">GRATUIT</Badge>
          ) : (
            <div className="flex items-center justify-center mb-2 text-secondary text-sm">
              <Coins className="w-3 h-3 mr-1" />
              {item.price}
            </div>
          )}

          <Button
            onClick={() => handleBuyItem(item, category)}
            size="sm"
            className={`
              w-full text-xs
              ${isCurrent 
                ? 'bg-success hover:bg-success text-game-dark' 
                : isOwned 
                ? 'bg-gradient-primary hover:scale-105' 
                : canAfford
                ? 'bg-gradient-primary hover:scale-105'
                : 'bg-button-bg border border-wheel-border text-text-muted cursor-not-allowed'
              }
              transition-all duration-300
            `}
            disabled={!canAfford && !isOwned}
          >
            {isCurrent ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                ÉQUIPÉ
              </>
            ) : isOwned ? (
              'ÉQUIPER'
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
    <div className={`min-h-screen bg-gradient-game p-4 ${currentBg} ${currentCircle} ${currentEffect}`}>
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
            {BACKGROUNDS.map((item) => renderItemCard(item, 'bg'))}
          </div>
        </TabsContent>

        <TabsContent value="circles" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CIRCLE_COLORS.map((item) => renderItemCard(item, 'circle'))}
          </div>
        </TabsContent>

        <TabsContent value="effects" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SPECIAL_EFFECTS.map((item) => renderItemCard(item, 'effect'))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <div className="text-center mt-6 text-text-muted animate-fade-in">
        <p className="text-sm">
          💡 Combinez les fonds, cercles et effets pour créer votre style unique!
        </p>
      </div>
    </div>
  );
};