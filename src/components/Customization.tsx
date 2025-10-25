import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check } from 'lucide-react';
import { useLanguage, translations } from '@/hooks/useLanguage';

interface CustomizationItem {
  id: string;
  name: string;
  type: 'background' | 'circle' | 'effect';
  preview: string;
  color?: string;
}

interface Customization {
  background: string;
  circle: string;
  effect: string;
}

interface CustomizationProps {
  ownedItems: CustomizationItem[];
  currentCustomization: Customization;
  onApplyCustomization: (customization: Customization) => void;
  onBack: () => void;
}

export const Customization: React.FC<CustomizationProps> = ({
  ownedItems,
  currentCustomization,
  onApplyCustomization,
  onBack,
}) => {
  const [selectedCustomization, setSelectedCustomization] = React.useState(currentCustomization);

  const backgrounds = ownedItems.filter(item => item.type === 'background');
  const circles = ownedItems.filter(item => item.type === 'circle');
  const effects = ownedItems.filter(item => item.type === 'effect');

  const handleApply = () => {
    onApplyCustomization(selectedCustomization);
    onBack();
  };

  return (
    <div className="min-h-screen bg-gradient-game p-4 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          onClick={onBack}
          variant="outline"
          size="lg"
          className="border-wheel-border hover:bg-button-hover"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </Button>
        
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          PERSONNALISATION
        </h1>
        
        <Button 
          onClick={handleApply}
          className="bg-gradient-primary hover:scale-105 shadow-glow-primary transition-all duration-300"
        >
          <Check className="w-5 h-5 mr-2" />
          Appliquer
        </Button>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {/* Arrière-plans */}
        <div>
          <h2 className="text-2xl font-bold text-primary mb-4">🎨 Palettes de couleurs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {backgrounds.map((item) => (
              <Card 
                key={item.id}
                className={`relative p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedCustomization.background === item.id 
                    ? 'border-primary shadow-glow-primary' 
                    : 'border-wheel-border hover:border-primary'
                }`}
                onClick={() => setSelectedCustomization(prev => ({ ...prev, background: item.id }))}
              >
                <div 
                  className="h-20 rounded-lg mb-3"
                  style={{ background: item.color || item.preview }}
                />
                <div className="text-center">
                  <h3 className="font-semibold text-text-primary text-sm">{item.name}</h3>
                </div>
                {selectedCustomization.background === item.id && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                    <Check className="w-3 h-3" />
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Cercles */}
        <div>
          <h2 className="text-2xl font-bold text-primary mb-4">⭕ Cercles</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {circles.map((item) => (
              <Card 
                key={item.id}
                className={`relative p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedCustomization.circle === item.id 
                    ? 'border-primary shadow-glow-primary' 
                    : 'border-wheel-border hover:border-primary'
                }`}
                onClick={() => setSelectedCustomization(prev => ({ ...prev, circle: item.id }))}
              >
                <div className="flex items-center justify-center h-20 mb-3">
                  <div 
                    className="w-16 h-16 rounded-full border-4"
                    style={{ borderColor: item.color || '#4ee1a0' }}
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-text-primary text-sm">{item.name}</h3>
                </div>
                {selectedCustomization.circle === item.id && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                    <Check className="w-3 h-3" />
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Effets */}
        <div>
          <h2 className="text-2xl font-bold text-primary mb-4">✨ Effets</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {effects.map((item) => (
              <Card 
                key={item.id}
                className={`relative p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedCustomization.effect === item.id 
                    ? 'border-primary shadow-glow-primary' 
                    : 'border-wheel-border hover:border-primary'
                }`}
                onClick={() => setSelectedCustomization(prev => ({ ...prev, effect: item.id }))}
              >
                <div className="flex items-center justify-center h-20 mb-3">
                  <div 
                    className="w-8 h-8 rounded-full animate-pulse"
                    style={{ backgroundColor: item.color || '#4ee1a0' }}
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-text-primary text-sm">{item.name}</h3>
                </div>
                {selectedCustomization.effect === item.id && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                    <Check className="w-3 h-3" />
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};