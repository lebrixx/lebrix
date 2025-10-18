import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, Coins, Palette, Star, Crown, Zap, Sparkles, Lock, AlertTriangle, Video, Ticket } from 'lucide-react';
import { THEMES } from '@/constants/themes';
import { cfgModes, ModeID } from '@/constants/modes';
import { BOOSTS } from '@/types/boosts';
import { useBoosts } from '@/hooks/useBoosts';
import { useToast } from '@/hooks/use-toast';
import { getDailyRewardState } from '@/utils/dailyRewards';
import { getTickets, addTickets } from '@/utils/ticketSystem';
import { Ads } from '@/ads/AdService';
import { showRewardedFor } from '@/ads/RewardRouter';

// Réorganiser les thèmes pour mettre theme-royal en premier
const availableThemes = [
  THEMES.find(t => t.id === 'theme-royal')!,
  ...THEMES.filter(t => t.id !== 'theme-royal')
];

interface ShopProps {
  coins: number;
  ownedThemes: string[];
  currentTheme: string;
  unlockedModes: string[];
  onBack: () => void;
  onPurchaseTheme: (theme: any) => boolean;
  onEquipTheme: (themeId: string) => void;
  onPurchaseMode: (modeId: string, price: number) => boolean;
  onSpendCoins: (amount: number) => boolean;
}

const GAME_MODES_SHOP = [
  {
    id: ModeID.ZONE_TRAITRESSE,
    name: cfgModes[ModeID.ZONE_TRAITRESSE].name,
    description: cfgModes[ModeID.ZONE_TRAITRESSE].desc,
    price: 1000,
    icon: AlertTriangle,
  },
  {
    id: 'expert_tickets',
    name: 'Pack de Tickets Expert',
    description: '4 tickets pour jouer au mode Mémoire (Expert). 1 ticket = 1 partie.',
    price: 100,
    icon: Star,
    isTicketPack: true,
  }
];

export const Shop: React.FC<ShopProps> = ({
  coins,
  ownedThemes,
  currentTheme,
  unlockedModes,
  onBack,
  onPurchaseTheme,
  onEquipTheme,
  onPurchaseMode,
  onSpendCoins,
}) => {
  const [activeTab, setActiveTab] = useState('themes');
  const [currentTickets, setCurrentTickets] = useState(getTickets());
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const { toast } = useToast();

  // Initialiser AdMob
  useEffect(() => {
    Ads.init();
  }, []);

  // Mettre à jour le chrono chaque seconde
  useEffect(() => {
    const updateCooldown = () => {
      setCooldownRemaining(Ads.getCooldownRemaining());
    };

    // Mise à jour initiale
    updateCooldown();

    // Mettre à jour chaque seconde
    const interval = setInterval(updateCooldown, 1000);

    return () => clearInterval(interval);
  }, []);
  
  // Vérifier si l'utilisateur a atteint 7 jours de récompenses
  const dailyRewardState = getDailyRewardState();
  const hasReached7Days = dailyRewardState.currentStreak >= 7 || dailyRewardState.totalClaimed >= 7;
  
  const handlePurchase = (theme: any) => {
    if (ownedThemes.includes(theme.id)) {
      onEquipTheme(theme.id);
      return;
    }

    // Vérifier si c'est le thème royal
    if (theme.id === 'theme-royal' && !hasReached7Days) {
      toast({
        title: "Thème verrouillé",
        description: "Complétez 7 jours de récompenses quotidiennes pour débloquer ce thème exclusif !",
        variant: "destructive"
      });
      return;
    }

    const success = onPurchaseTheme(theme);
    if (success) {
      onEquipTheme(theme.id);
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

  const handleModeUnlock = (modeId: string, price: number) => {
    // Cas spécial pour l'achat de tickets
    if (modeId === 'expert_tickets') {
      if (coins < price) {
        toast({
          title: "Coins insuffisants",
          description: `Il te faut ${price} coins pour acheter ce pack.`,
          variant: "destructive"
        });
        return;
      }
      
      if (onSpendCoins(price)) {
        addTickets(4);
        setCurrentTickets(getTickets());
        toast({
          title: "Pack acheté !",
          description: "Tu as reçu 4 tickets pour le mode Expert !",
        });
      }
      return;
    }
    
    const success = onPurchaseMode(modeId, price);
    if (success) {
      // Mode débloqué avec succès
    }
  };

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col p-4 pt-12">
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
          BOUTIQUE
        </h1>
        <p className="text-text-secondary text-lg">
          Débloquez des thèmes, modes de jeux et boosts
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="themes">Thèmes</TabsTrigger>
          <TabsTrigger value="modes">Modes de jeux</TabsTrigger>
          <TabsTrigger value="boosts">Boosts</TabsTrigger>
        </TabsList>

        {/* Themes Tab */}
        <TabsContent value="themes">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableThemes.map((theme) => {
              const owned = isOwned(theme.id);
              const equipped = isEquipped(theme.id);
              const isRoyalTheme = theme.id === 'theme-royal';
              const isRoyalLocked = isRoyalTheme && !hasReached7Days;
              
              return (
                <Card 
                  key={theme.id}
                  className={`
                    relative overflow-hidden border-2 transition-all duration-300 hover:scale-105
                    ${isRoyalLocked
                      ? 'border-yellow-400/50 bg-yellow-400/5 opacity-90'
                      : equipped 
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
                    <div className={`absolute inset-0 ${isRoyalLocked ? 'bg-black/60' : 'bg-gradient-to-br from-transparent to-black/30'}`} />
                    
                    {/* Locked Badge pour thème royal */}
                    {isRoyalLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-yellow-400/20 backdrop-blur-sm border-2 border-yellow-400 rounded-full p-4">
                          <Lock className="w-10 h-10 text-yellow-400" />
                        </div>
                      </div>
                    )}
                    
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
                    {owned && !equipped && !isRoyalLocked && (
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
                      {!isRoyalLocked && theme.price > 0 && (
                        <div className="flex items-center gap-1 text-secondary">
                          <Coins className="w-4 h-4" />
                          <span className="font-bold">{theme.price}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                      {theme.description}
                    </p>

                    {/* Message de déblocage pour thème royal */}
                    {isRoyalLocked && (
                      <div className="mb-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                        <p className="text-xs text-yellow-400 flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          <span>Complétez 7 jours de récompenses quotidiennes pour débloquer ce thème légendaire !</span>
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="space-y-2">
                      {isRoyalLocked ? (
                        <Button 
                          className="w-full bg-yellow-400/20 border border-yellow-400 text-yellow-400 hover:bg-yellow-400/30" 
                          disabled
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Verrouillé - 7 jours requis
                        </Button>
                      ) : equipped ? (
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
                      ) : theme.price <= 0 ? (
                        <Button 
                          onClick={() => handlePurchase(theme)}
                          className="w-full bg-gradient-primary hover:scale-105 transition-all duration-300"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Débloquer
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
        </TabsContent>

        {/* Game Modes Tab */}
        <TabsContent value="modes">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GAME_MODES_SHOP.map((mode) => {
              const isTicketPack = (mode as any).isTicketPack;
              const isUnlocked = !isTicketPack && unlockedModes.includes(mode.id);
              const IconComponent = mode.icon;
              
              return (
                <Card 
                  key={mode.id}
                  className={`
                    relative overflow-hidden border-2 transition-all duration-300 hover:scale-105
                    ${isUnlocked 
                      ? 'border-success bg-success/5' 
                      : 'border-wheel-border bg-button-bg hover:border-primary/50'
                    }
                  `}
                >
                  <div className="p-6">
                    {/* Mode Icon & Name */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`
                        p-3 rounded-full 
                        ${isUnlocked ? 'bg-success text-game-dark' : 'bg-wheel-segment text-primary'}
                      `}>
                        <IconComponent className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-text-primary">
                          {mode.name}
                        </h3>
                        {isUnlocked && (
                          <Badge variant="secondary" className="mt-1">
                            <Check className="w-3 h-3 mr-1" />
                            Débloqué
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-text-secondary mb-6 leading-relaxed text-sm">
                      {mode.description}
                    </p>

                    {/* Tickets disponibles pour le pack de tickets */}
                    {isTicketPack && (
                      <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-muted">Tickets actuels:</span>
                          <div className="flex items-center gap-1 text-primary">
                            <Ticket className="w-4 h-4" />
                            <span className="font-bold">{currentTickets}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-wheel-segment/20 rounded-lg border border-wheel-border">
                      <span className="text-sm text-text-muted">Prix:</span>
                      <div className="flex items-center gap-1 text-secondary">
                        <Coins className="w-4 h-4" />
                        <span className="font-bold">{mode.price}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isTicketPack ? (
                      <div className="space-y-2">
                        <Button 
                          onClick={() => handleModeUnlock(mode.id, mode.price)}
                          className="w-full bg-gradient-primary hover:scale-105 transition-all duration-300"
                          disabled={coins < mode.price}
                        >
                          <Ticket className="w-4 h-4 mr-2" />
                          Acheter 4 tickets ({mode.price} coins)
                        </Button>
                          <Button 
                            onClick={async () => {
                              const success = await showRewardedFor('ticket', {
                                onTicket: (amount) => {
                                  addTickets(amount);
                                  setCurrentTickets(getTickets());
                                },
                                showToast: (title, description, variant) => {
                                  toast({ title, description, variant });
                                },
                              });
                            }}
                            className="w-full bg-purple-500/20 border border-purple-500 text-purple-400 hover:bg-purple-500/30"
                            disabled={false}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Obtenir 5 via pub
                          {!Ads.isReady() && cooldownRemaining > 0 && (
                            <span className="ml-1 text-xs">({cooldownRemaining}s)</span>
                          )}
                        </Button>
                      </div>
                    ) : isUnlocked ? (
                      <Button 
                        className="w-full bg-success hover:bg-success/90" 
                        disabled
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Mode Débloqué
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleModeUnlock(mode.id, mode.price)}
                        className="w-full bg-gradient-primary hover:scale-105 transition-all duration-300"
                        disabled={coins < mode.price}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Débloquer ({mode.price} coins)
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Boosts Tab */}
        <TabsContent value="boosts">
          <BoostsSection coins={coins} onSpendCoins={onSpendCoins} />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="text-center mt-8 text-text-muted">
        <p>Gagnez des coins en jouant pour débloquer de nouveaux thèmes !</p>
      </div>
    </div>
  );
};

// Section Boosts
interface BoostsSectionProps {
  coins: number;
  onSpendCoins: (amount: number) => boolean;
}

const BoostsSection: React.FC<BoostsSectionProps> = ({ coins, onSpendCoins }) => {
  const { addBoost, getBoostCount } = useBoosts();
  const { toast } = useToast();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Mettre à jour le chrono chaque seconde
  useEffect(() => {
    const updateCooldown = () => {
      setCooldownRemaining(Ads.getCooldownRemaining());
    };

    // Mise à jour initiale
    updateCooldown();

    // Mettre à jour chaque seconde
    const interval = setInterval(updateCooldown, 1000);

    return () => clearInterval(interval);
  }, []);

  const canAfford = (price: number) => coins >= price;

  const handlePurchaseWithCoins = (boostId: any, price: number) => {
    if (!canAfford(price)) {
      toast({
        title: "Coins insuffisants",
        description: `Il te faut ${price} coins pour acheter ce boost.`,
        variant: "destructive"
      });
      return;
    }

    // Utiliser le callback pour déduire les coins correctement
    if (onSpendCoins(price)) {
      addBoost(boostId);
      
      toast({
        title: "Boost acheté !",
        description: `Tu as acheté un boost ${BOOSTS[boostId].name}.`,
      });
    }
  };

  const handlePurchaseWithAd = async (boostId: any) => {
    // Mapper les boosts à leurs kinds
    const boostKindMap: Record<string, 'boost1' | 'boost2' | 'boost3'> = {
      'shield': 'boost1',
      'bigger_zone': 'boost2',
      'start_20': 'boost3',
    };

    const kind = boostKindMap[boostId];
    if (!kind) return;

    const success = await showRewardedFor(kind, {
      onBoost: (receivedBoostId) => {
        addBoost(receivedBoostId);
      },
      showToast: (title, description, variant) => {
        toast({ title, description, variant });
      },
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.values(BOOSTS).map((boost) => {
        const owned = getBoostCount(boost.id);
        
        return (
          <Card 
            key={boost.id}
            className="relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 border-wheel-border bg-button-bg hover:border-primary/50"
          >
            <div className="p-6">
              {/* Boost Icon & Name */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">
                  {boost.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text-primary mb-1">
                    {boost.name}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Possédés: {owned}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <p className="text-text-secondary mb-6 leading-relaxed text-sm">
                {boost.description}
              </p>

              {/* Purchase Options */}
              <div className="space-y-3">
                {/* Purchase with Coins */}
                <Button 
                  onClick={() => handlePurchaseWithCoins(boost.id, boost.coinPrice)}
                  className="w-full bg-gradient-primary hover:scale-105 transition-all duration-300"
                  disabled={!canAfford(boost.coinPrice)}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Acheter pour {boost.coinPrice} coins
                </Button>

                {/* Purchase with Ad */}
                <Button 
                  onClick={() => handlePurchaseWithAd(boost.id)}
                  variant="outline"
                  className="w-full border-wheel-border hover:bg-button-hover"
                  disabled={false}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Obtenir via pub
                  {!Ads.isReady() && cooldownRemaining > 0 && (
                    <span className="ml-1 text-xs">({cooldownRemaining}s)</span>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};