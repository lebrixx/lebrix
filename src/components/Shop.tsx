import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Coins, Palette, Star, Crown, Zap, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const availableThemes = [
  {
    id: 'theme-neon',
    name: 'Néon Électrique',
    price: 0,
    description: 'Le thème par défaut avec des couleurs cyber électriques',
    rarity: 'common',
    preview: {
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d2d5e 100%)',
      circle: '#00ffff',
      successZone: '#4ee1a0'
    }
  },
  {
    id: 'theme-sunset',
    name: 'Coucher de Soleil',
    price: 100,
    description: 'Horizon doré et rose avec des nuances chaudes',
    rarity: 'common',
    preview: {
      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffcc29 100%)',
      circle: '#ff4444',
      successZone: '#ff6b35'
    }
  },
  {
    id: 'theme-ocean',
    name: 'Profondeur Océanique',
    price: 150,
    description: 'Abysses bleu profond avec des reflets argentés',
    rarity: 'rare',
    preview: {
      background: 'linear-gradient(135deg, #0077be 0%, #00a8cc 50%, #4dd0e1 100%)',
      circle: '#0077be',
      successZone: '#00a8cc'
    }
  },
  {
    id: 'theme-forest',
    name: 'Forêt Enchantée',
    price: 150,
    description: 'Forêt mystique avec des verts naturels',
    rarity: 'rare',
    preview: {
      background: 'linear-gradient(135deg, #2d5a27 0%, #76c893 50%, #99d98c 100%)',
      circle: '#2d5a27',
      successZone: '#76c893'
    }
  },
  {
    id: 'theme-volcanic',
    name: 'Éruption Volcanique',
    price: 200,
    description: 'Lave ardente avec des rouges et oranges intenses',
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #ff4444 0%, #cc2936 50%, #8b0000 100%)',
      circle: '#ff4444',
      successZone: '#cc2936'
    }
  },
  {
    id: 'theme-arctic',
    name: 'Cristaux Arctiques',
    price: 120,
    description: 'Glace cristalline avec des bleus glacés',
    rarity: 'rare',
    preview: {
      background: 'linear-gradient(135deg, #a8dadc 0%, #f1faee 50%, #e9ecef 100%)',
      circle: '#a8dadc',
      successZone: '#457b9d'
    }
  },
  {
    id: 'theme-cosmic',
    name: 'Nébuleuse Cosmique',
    price: 300,
    description: 'Galaxie lointaine avec des violets et bleus mystiques',
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #1a0533 0%, #4c1d95 50%, #6366f1 100%)',
      circle: '#8b5cf6',
      successZone: '#a855f7'
    }
  },
  {
    id: 'theme-golden',
    name: 'Luxe Doré',
    price: 250,
    description: 'Opulence dorée avec des accents luxueux',
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #b8860b 0%, #ffd700 50%, #ffed4e 100%)',
      circle: '#ffd700',
      successZone: '#f59e0b'
    }
  },
  {
    id: 'theme-rainbow',
    name: 'Spectre Arc-en-ciel',
    price: 500,
    description: 'Toutes les couleurs du spectre en harmonie parfaite',
    rarity: 'legendary',
    preview: {
      background: 'linear-gradient(135deg, #ff0080 0%, #ff8c00 25%, #ffd700 50%, #00ff80 75%, #0080ff 100%)',
      circle: '#ff0080',
      successZone: '#00ff80'
    }
  },
  {
    id: 'theme-shadow',
    name: 'Ombres Mystiques',
    price: 400,
    description: 'Ténèbres profondes avec des éclats violets',
    rarity: 'legendary',
    preview: {
      background: 'linear-gradient(135deg, #000000 0%, #1f2937 50%, #374151 100%)',
      circle: '#6b7280',
      successZone: '#8b5cf6'
    }
  },
  {
    id: 'theme-emerald',
    name: 'Émeraude Pure',
    price: 180,
    description: 'Verts émeraude cristallins et purs',
    rarity: 'rare',
    preview: {
      background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
      circle: '#059669',
      successZone: '#10b981'
    }
  },
  {
    id: 'theme-plasma',
    name: 'Énergie Plasma',
    price: 220,
    description: 'Énergie électrique bleue pure',
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
      circle: '#3b82f6',
      successZone: '#1d4ed8'
    }
  }
];

interface ShopProps {
  coins: number;
  ownedItems: any[];
  currentTheme: string;
  onBack: () => void;
  onPurchaseTheme: (theme: any) => boolean;
}

export const Shop: React.FC<ShopProps> = ({
  coins,
  ownedItems,
  currentTheme,
  onBack,
  onPurchaseTheme,
}) => {
  const handlePurchase = (theme: any) => {
    if (ownedItems.find(owned => owned.id === theme.id)) {
      toast.error('Vous possédez déjà ce thème!');
      return;
    }

    if (onPurchaseTheme(theme)) {
      toast.success(`${theme.name} acheté et équipé!`, {
        description: `Vous avez dépensé ${theme.price} coins`,
      });
    } else {
      toast.error('Pas assez de coins!', {
        description: `Il vous manque ${theme.price - coins} coins`,
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

  const renderThemeCard = (theme: any) => {
    const isOwned = ownedItems.find(owned => owned.id === theme.id) || theme.price === 0;
    const isEquipped = currentTheme === theme.id;
    const canAfford = coins >= theme.price;
    const isFree = theme.price === 0;

    return (
      <Card 
        key={theme.id}
        className={`
          bg-button-bg border-wheel-border p-4 hover:scale-105 transition-all duration-300 cursor-pointer animate-scale-in
          ${isEquipped ? 'border-success shadow-glow-success ring-2 ring-success/50' : ''}
          ${isOwned && !isEquipped ? 'border-blue-500/50 shadow-blue-500/20' : ''}
          ${theme.rarity === 'rare' ? 'shadow-blue-500/20' : ''}
          ${theme.rarity === 'epic' ? 'shadow-purple-500/20' : ''}
          ${theme.rarity === 'legendary' ? 'shadow-yellow-500/20' : ''}
        `}
      >
        {/* Preview */}
        <div className="relative mb-3">
          <div 
            className={`
              w-full h-24 rounded-lg border-2 border-wheel-border relative overflow-hidden
              ${theme.rarity === 'legendary' ? 'animate-pulse' : ''}
            `}
            style={{ background: theme.preview.background }}
          >
            {/* Mini game preview */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-16 h-16">
                {/* Circle */}
                <div 
                  className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: theme.preview.circle }}
                />
                {/* Success zone */}
                <div 
                  className="absolute w-3 h-3 rounded-full top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{ backgroundColor: theme.preview.successZone }}
                />
                {/* Ball */}
                <div 
                  className="absolute w-2 h-2 rounded-full top-1 left-1/2 transform -translate-x-1/2"
                  style={{ backgroundColor: theme.preview.circle }}
                />
              </div>
            </div>
          </div>
          
          {/* Rarity Badge */}
          {theme.rarity !== 'common' && (
            <Badge className={`absolute -top-2 -left-2 ${getRarityColor(theme.rarity)}`}>
              {getRarityIcon(theme.rarity)}
              {theme.rarity.toUpperCase()}
            </Badge>
          )}
          
          {/* Status Badge */}
          {isEquipped && (
            <Badge className="absolute -top-2 -right-2 bg-success text-game-dark animate-pulse">
              <Check className="w-3 h-3 mr-1" />
              ÉQUIPÉ
            </Badge>
          )}
          
          {isOwned && !isEquipped && (
            <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white">
              <Check className="w-3 h-3 mr-1" />
              POSSÉDÉ
            </Badge>
          )}
        </div>

        {/* Theme Info */}
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-primary mb-1">{theme.name}</h3>
          <p className="text-text-muted text-xs">{theme.description}</p>
        </div>

        {/* Price and Action */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2 text-secondary text-sm">
            {isFree ? (
              <span className="text-success">GRATUIT</span>
            ) : (
              <>
                <Coins className="w-3 h-3 mr-1" />
                {theme.price}
              </>
            )}
          </div>

          <Button
            onClick={() => isOwned ? null : handlePurchase(theme)}
            size="sm"
            className={`
              w-full text-xs transition-all duration-300
              ${isEquipped 
                ? 'bg-success hover:bg-success text-game-dark cursor-default' 
                : isOwned
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : canAfford || isFree
                ? 'bg-gradient-primary hover:scale-105'
                : 'bg-button-bg border border-wheel-border text-text-muted cursor-not-allowed'
              }
            `}
            disabled={isEquipped || (!canAfford && !isFree && !isOwned)}
          >
            {isEquipped ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                ÉQUIPÉ
              </>
            ) : isOwned ? (
              <>
                <Palette className="w-3 h-3 mr-1" />
                ÉQUIPER
              </>
            ) : (canAfford || isFree) ? (
              isFree ? 'RÉCUPÉRER' : 'ACHETER & ÉQUIPER'
            ) : (
              <>
                <Coins className="w-3 h-3 mr-1" />
                {theme.price - coins} coins manquants
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
          <h1 className="text-2xl font-bold text-primary mb-1">🎨 THÈMES PREMIUM</h1>
          <div className="flex items-center justify-center text-secondary">
            <Coins className="w-4 h-4 mr-2" />
            <span className="text-xl font-bold">{coins}</span>
            <span className="ml-1">Coins</span>
          </div>
        </div>

        <div className="w-20"></div>
      </div>

      {/* Description */}
      <div className="text-center mb-6 text-text-muted animate-fade-in">
        <p>🌈 Transformez votre expérience de jeu avec des thèmes complets!</p>
        <p className="text-sm mt-1">Chaque thème inclut: fond, cercle, zone de succès et bille assortis</p>
      </div>

      {/* Themes Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availableThemes.map((theme) => renderThemeCard(theme))}
        </div>
      </div>

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
          💡 Les thèmes achetés sont équipés automatiquement et changent immédiatement votre jeu!
        </p>
      </div>
    </div>
  );
};