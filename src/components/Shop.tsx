import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Coins, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface Theme {
  id: string;
  name: string;
  price: number;
  description: string;
  className: string;
  colors: {
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

const THEMES: Theme[] = [
  {
    id: 'theme-neon',
    name: 'Néon Classique',
    price: 0,
    description: 'Style cyan et magenta électrique',
    className: 'theme-neon',
    colors: { primary: '#00FFFF', secondary: '#FF00FF', accent: '#00FF00' },
  },
  {
    id: 'theme-fire',
    name: 'Flamme Ardente',
    price: 25,
    description: 'Barre rouge flamboyante avec trails',
    className: 'theme-fire',
    colors: { primary: '#FF4500', secondary: '#FF6B00', accent: '#FFB347' },
  },
  {
    id: 'theme-lightning',
    name: 'Éclair Électrique',
    price: 50,
    description: 'Vitesse pure avec effets électriques',
    className: 'theme-lightning',
    colors: { primary: '#00BFFF', secondary: '#87CEEB', accent: '#E0E0E0' },
  },
  {
    id: 'theme-laser',
    name: 'Laser Précision',
    price: 75,
    description: 'Faisceau laser ultra-précis',
    className: 'theme-laser',
    colors: { primary: '#00FF00', secondary: '#32CD32', accent: '#90EE90' },
  },
  {
    id: 'theme-plasma',
    name: 'Plasma Violet',
    price: 100,
    description: 'Énergie plasma mystique',
    className: 'theme-plasma',
    colors: { primary: '#8A2BE2', secondary: '#9932CC', accent: '#DDA0DD' },
  },
  {
    id: 'theme-cosmic',
    name: 'Cosmique',
    price: 125,
    description: 'Voyage dans les étoiles',
    className: 'theme-cosmic',
    colors: { primary: '#4B0082', secondary: '#663399', accent: '#9966CC' },
  },
  {
    id: 'theme-dragon',
    name: 'Souffle Dragon',
    price: 150,
    description: 'Puissance légendaire du dragon',
    className: 'theme-dragon',
    colors: { primary: '#DC143C', secondary: '#B22222', accent: '#FF6347' },
  },
  {
    id: 'theme-diamond',
    name: 'Diamant Éternel',
    price: 200,
    description: 'Brillance cristalline parfaite',
    className: 'theme-diamond',
    colors: { primary: '#E6E6FA', secondary: '#D8BFD8', accent: '#F0F8FF' },
  },
];

export const Shop: React.FC<ShopProps> = ({ 
  coins, 
  onBack, 
  onPurchase,
  currentTheme = '',
  onThemeChange = () => {}
}) => {
  const [localTheme, setLocalTheme] = useState(currentTheme);
  const [ownedThemes, setOwnedThemes] = useState<string[]>(() => {
    const saved = localStorage.getItem('luckyStopOwnedThemes');
    return saved ? JSON.parse(saved) : ['theme-neon']; // Neon is free
  });

  const [previewTheme, setPreviewTheme] = useState<string>(localTheme);

  useEffect(() => {
    localStorage.setItem('luckyStopOwnedThemes', JSON.stringify(ownedThemes));
  }, [ownedThemes]);

  const handleBuyTheme = (theme: Theme) => {
    if (ownedThemes.includes(theme.id)) {
      // Already owned, just equip it
      setLocalTheme(theme.className);
      setPreviewTheme(theme.className);
      onThemeChange(theme.className);
      toast.success(`Thème ${theme.name} équipé!`);
      return;
    }

    if (onPurchase(theme.price)) {
      setOwnedThemes(prev => [...prev, theme.id]);
      setLocalTheme(theme.className);
      setPreviewTheme(theme.className);
      onThemeChange(theme.className);
      toast.success(`Thème ${theme.name} acheté et équipé!`);
    } else {
      toast.error(`Pas assez de coins! Vous avez besoin de ${theme.price} coins.`);
    }
  };

  const handlePreview = (theme: Theme) => {
    setPreviewTheme(theme.className);
  };

  return (
    <div className={`min-h-screen bg-gradient-game p-4 ${previewTheme}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <Button 
          onClick={onBack}
          variant="outline"
          className="border-wheel-border hover:bg-button-hover"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">BOUTIQUE DE THÈMES</h1>
          <div className="flex items-center text-secondary text-lg">
            <Coins className="w-5 h-5 mr-2" />
            {coins} Coins
          </div>
        </div>

        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {THEMES.map((theme) => {
          const isOwned = ownedThemes.includes(theme.id);
          const isCurrent = localTheme === theme.className;
          const canAfford = coins >= theme.price;
          
          return (
            <Card 
              key={theme.id}
              className={`
                bg-button-bg border-wheel-border p-6 hover:scale-105 transition-all duration-300 cursor-pointer
                ${previewTheme === theme.className ? 'ring-2 ring-primary shadow-glow-primary' : ''}
                animate-scale-in
              `}
              style={{ animationDelay: `${THEMES.indexOf(theme) * 100}ms` }}
              onMouseEnter={() => handlePreview(theme)}
              onMouseLeave={() => setPreviewTheme(localTheme)}
            >
              {/* Theme Preview */}
              <div className="relative mb-4">
                <div 
                  className="w-full h-24 rounded-lg border-2 border-wheel-border relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                  }}
                >
                  {/* Mini wheel preview */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white/30 animate-spin-wheel"
                       style={{ animationDuration: '3s' }}>
                    <div 
                      className="absolute inset-2 rounded-full"
                      style={{ 
                        background: `conic-gradient(from 0deg, ${theme.colors.accent} 0deg, transparent 60deg, transparent 300deg, ${theme.colors.accent} 360deg)`,
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Status Badge */}
                {isCurrent && (
                  <Badge className="absolute -top-2 -right-2 bg-success text-game-dark">
                    <Check className="w-3 h-3 mr-1" />
                    EQUIPPED
                  </Badge>
                )}
                
                {isOwned && !isCurrent && (
                  <Badge variant="outline" className="absolute -top-2 -right-2 border-primary text-primary">
                    OWNED
                  </Badge>
                )}
              </div>

              {/* Theme Info */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-primary mb-1">{theme.name}</h3>
                <p className="text-text-muted text-sm">{theme.description}</p>
              </div>

              {/* Price and Action */}
              <div className="text-center">
                {theme.price === 0 ? (
                  <Badge variant="secondary" className="mb-3">FREE</Badge>
                ) : (
                  <div className="flex items-center justify-center mb-3 text-secondary">
                    <Coins className="w-4 h-4 mr-1" />
                    {theme.price}
                  </div>
                )}

                <Button
                  onClick={() => handleBuyTheme(theme)}
                  className={`
                    w-full
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
                      <Check className="w-4 h-4 mr-2" />
                      ÉQUIPÉ
                    </>
                  ) : isOwned ? (
                    'ÉQUIPER'
                  ) : canAfford ? (
                    'ACHETER'
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      VERROUILLÉ
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tips */}
      <div className="text-center mt-8 text-text-muted animate-fade-in">
        <p className="text-sm">
          💡 Survolez les thèmes pour les prévisualiser • Gagnez des coins en jouant!
        </p>
      </div>
    </div>
  );
};