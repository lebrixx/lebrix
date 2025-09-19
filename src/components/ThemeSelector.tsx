import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ArrowLeft, Check } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview: string;
}

const THEMES: Theme[] = [
  { id: 'theme-neon', name: 'Néon', description: 'Éclat cybernétique', preview: 'hsl(180, 100%, 50%)' },
  { id: 'theme-sunset', name: 'Coucher de Soleil', description: 'Chaleur orangée', preview: 'hsl(25, 100%, 60%)' },
  { id: 'theme-matrix', name: 'Matrix', description: 'Code vert', preview: 'hsl(120, 100%, 50%)' },
  { id: 'theme-ocean', name: 'Océan', description: 'Profondeurs bleues', preview: 'hsl(200, 100%, 50%)' },
  { id: 'theme-royal', name: 'Royal', description: 'Pourpre majestueux', preview: 'hsl(270, 100%, 60%)' },
  { id: 'theme-lava', name: 'Lave', description: 'Fusion ardente', preview: 'hsl(0, 100%, 60%)' },
  { id: 'theme-arctic', name: 'Arctique', description: 'Glace cristalline', preview: 'hsl(195, 100%, 85%)' },
  { id: 'theme-forest', name: 'Forêt', description: 'Nature verdoyante', preview: 'hsl(120, 60%, 40%)' },
  { id: 'theme-galaxy', name: 'Galaxie', description: 'Cosmos sombre', preview: 'hsl(260, 100%, 25%)' },
  { id: 'theme-cyberpunk', name: 'Cyberpunk', description: 'Néon rose', preview: 'hsl(320, 100%, 70%)' },
  { id: 'theme-golden', name: 'Doré', description: 'Éclat précieux', preview: 'hsl(45, 100%, 50%)' }
];

interface ThemeSelectorProps {
  ownedThemes: string[];
  currentTheme: string;
  onThemeSelect: (theme: string) => void;
  onStartGame: () => void;
  onBack: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  ownedThemes,
  currentTheme,
  onThemeSelect,
  onStartGame,
  onBack
}) => {
  const availableThemes = THEMES.filter(theme => 
    theme.id === 'theme-neon' || ownedThemes.includes(theme.id)
  );

  return (
    <div className={`min-h-screen bg-gradient-game flex flex-col items-center justify-center p-4 ${currentTheme}`}>
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          SÉLECTION DU THÈME
        </h1>
        <p className="text-text-secondary">
          Choisissez votre style de jeu
        </p>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 max-w-4xl animate-scale-in">
        {availableThemes.map((theme) => (
          <Card
            key={theme.id}
            className={`relative bg-button-bg border-wheel-border p-4 cursor-pointer hover:scale-105 transition-all duration-300 ${
              currentTheme === theme.id ? 'ring-2 ring-primary shadow-glow-primary' : ''
            }`}
            onClick={() => onThemeSelect(theme.id)}
          >
            {/* Theme Preview Circle */}
            <div 
              className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-wheel-border"
              style={{ 
                background: `radial-gradient(circle, ${theme.preview}, ${theme.preview}80)`,
                boxShadow: `0 0 20px ${theme.preview}40`
              }}
            />
            
            {/* Theme Info */}
            <div className="text-center">
              <h3 className="font-bold text-text-primary mb-1">{theme.name}</h3>
              <p className="text-xs text-text-muted">{theme.description}</p>
            </div>

            {/* Current Theme Indicator */}
            {currentTheme === theme.id && (
              <div className="absolute top-2 right-2">
                <Check className="w-5 h-5 text-success" />
              </div>
            )}

            {/* Default Badge */}
            {theme.id === 'theme-neon' && (
              <Badge 
                variant="outline" 
                className="absolute top-2 left-2 text-xs border-primary text-primary"
              >
                Défaut
              </Badge>
            )}
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 w-full max-w-sm animate-fade-in">
        <Button 
          onClick={onBack}
          variant="outline"
          size="lg"
          className="flex-1 border-wheel-border hover:bg-button-hover transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </Button>

        <Button 
          onClick={onStartGame}
          size="lg"
          className="flex-1 bg-gradient-primary hover:scale-105 shadow-glow-primary transition-all duration-300 font-bold group"
        >
          <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
          JOUER
        </Button>
      </div>

      {/* Current Theme Display */}
      <div className="mt-6 text-center animate-fade-in">
        <div className="text-sm text-text-muted mb-2">Thème Actuel</div>
        <Badge 
          variant="outline" 
          className="border-primary text-primary px-4 py-2 animate-pulse-glow"
        >
          {availableThemes.find(t => t.id === currentTheme)?.name || 'NÉON'}
        </Badge>
      </div>
    </div>
  );
};