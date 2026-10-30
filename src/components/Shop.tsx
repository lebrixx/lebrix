import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Check, Coins, Star, Lock, AlertTriangle, Video, Ticket, Package, Loader2 } from 'lucide-react';
import { ShopPaidOffers } from '@/components/ShopPaidOffers';
import { PremiumOffer } from '@/components/PremiumOffer';
import { RainbowOffer } from '@/components/RainbowOffer';
import { cfgModes, ModeID, MODE_UNLOCK_PRICES } from '@/constants/modes';
import { BOOSTS } from '@/types/boosts';
import { useBoosts } from '@/hooks/useBoosts';
import { useToast } from '@/hooks/use-toast';
import { getTickets, addTickets } from '@/utils/ticketSystem';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import { useLanguage, translations } from '@/hooks/useLanguage';

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
  onAddCoins?: (amount: number) => void;
  initialTarget?: 'tickets' | null;
}

const GAME_MODES_SHOP = [
  {
    id: 'expert_tickets',
    name: 'Pack de Tickets Ball Balance',
    description: '__fallingTunnelTicketDesc__',
    price: 100,
    icon: Star,
    isTicketPack: true,
  },
  {
    id: ModeID.SURVIE_60S,
    name: cfgModes[ModeID.SURVIE_60S].name,
    description: cfgModes[ModeID.SURVIE_60S].desc,
    price: MODE_UNLOCK_PRICES[ModeID.SURVIE_60S] ?? 500,
    icon: Package,
    isTicketPack: false,
  }
];

export const Shop: React.FC<ShopProps> = ({
  coins,
  unlockedModes,
  onBack,
  onPurchaseMode,
  onSpendCoins,
  onAddCoins,
  initialTarget,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  
  const [activeTab, setActiveTab] = useState('modes');

  useEffect(() => {
    if (!initialTarget) return;
    setActiveTab('modes');
    const targetId = 'shop-mode-expert_tickets';
    // Wait for Tabs content to mount
    const timer = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background'), 2500);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [initialTarget]);
  const [currentTickets, setCurrentTickets] = useState(getTickets());
  
  const [showEssentialPack, setShowEssentialPack] = useState(false);
  const [isEssentialPurchasing, setIsEssentialPurchasing] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showRainbow, setShowRainbow] = useState(false);
  const { showRewardedAd, isShowing: isAdShowing, isReady: isAdReady, getCooldown: getAdCooldown } = useRewardedAd();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const updateCooldown = () => {
      setCooldownRemaining(getAdCooldown());
    };
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [getAdCooldown]);
  
  const handleModeUnlock = (modeId: string, price: number) => {
    // Cas spécial pour l'achat de tickets
    if (modeId === 'expert_tickets') {
      if (coins < price) {
        toast({
          title: t.insufficientCoins,
          description: t.insufficientCoinsDesc.replace('{amount}', String(price)),
          variant: "destructive"
        });
        return;
      }
      
      if (onSpendCoins(price)) {
        addTickets(4);
        setCurrentTickets(getTickets());
        toast({
          title: t.packBought,
          description: t.packBoughtDesc,
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
          {t.backToMenu}
        </Button>
        
        <div className="flex items-center gap-2 bg-button-bg border border-wheel-border rounded-lg px-4 py-2">
          <Coins className="w-5 h-5 text-secondary" />
          <span className="text-secondary font-bold text-lg">{coins}</span>
          <span className="text-text-muted">{t.coins}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
          {t.shopTitle}
        </h1>
        <p className="text-text-secondary text-lg">
          {t.shopDesc}
        </p>
      </div>

      {/* Pack Essentiel Dialog */}
      <Dialog open={showEssentialPack} onOpenChange={setShowEssentialPack}>
        <DialogContent className="bg-game-dark border-primary/40 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="flex flex-col items-center gap-3 mb-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Package className="w-8 h-8 text-primary-foreground" />
                </div>
                <span className="text-2xl font-extrabold bg-gradient-primary bg-clip-text text-transparent">{t.shopPackEssential}</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* Boosts */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-2xl">🛡️</span>
                <div className="flex-1">
                  <p className="text-text-primary font-semibold text-sm">{t.shopShieldLabel}</p>
                  <p className="text-text-muted text-xs">{t.shopShieldProtect}</p>
                </div>
                <Badge variant="secondary" className="text-xs font-bold">×5</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-2xl">💰</span>
                <div className="flex-1">
                  <p className="text-text-primary font-semibold text-sm">{t.shopGreenZonePlus}</p>
                  <p className="text-text-muted text-xs">{t.shopGreenZoneDesc}</p>
                </div>
                <Badge variant="secondary" className="text-xs font-bold">×5</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-2xl">🚀</span>
                <div className="flex-1">
                  <p className="text-text-primary font-semibold text-sm">{t.shopStartAt20}</p>
                  <p className="text-text-muted text-xs">{t.shopStartAt20Desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs font-bold">×5</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-2xl">❤️‍🔥</span>
                <div className="flex-1">
                  <p className="text-text-primary font-semibold text-sm">
                    {language === 'en' ? 'Second chance' : language === 'es' ? 'Segunda oportunidad' : 'Seconde chance'}
                  </p>
                  <p className="text-text-muted text-xs">
                    {language === 'en'
                      ? 'Auto-revive once per game'
                      : language === 'es'
                        ? 'Revivir automáticamente una vez'
                        : 'Revivre automatiquement une fois par partie'}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs font-bold">×5</Badge>
              </div>
            </div>

            {/* Tickets */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/20">
              <Ticket className="w-6 h-6 text-secondary" />
              <div className="flex-1">
                <p className="text-text-primary font-semibold text-sm">{t.ticketPackFallingTunnel}</p>
                <p className="text-text-muted text-xs">Ball Balance</p>
              </div>
              <Badge variant="secondary" className="text-xs font-bold">×15</Badge>
            </div>

            {/* Separator */}
            <div className="border-t border-wheel-border my-2" />

            {/* Buy Button */}
            <Button
              onClick={async () => {
                if (isEssentialPurchasing) return;
                setIsEssentialPurchasing(true);
                try {
                  const { purchaseEssentialNative } = await import('@/utils/purchaseEssentialService');
                  const result = await purchaseEssentialNative();
                  if (result === 'purchased') {
                    toast({ title: t.shopPackActivated, description: t.shopPackActivatedDesc });
                  } else if (result === 'unavailable') {
                    toast({ title: t.shopProductUnavailable, variant: "destructive" });
                    setShowEssentialPack(false);
                  } else if (result === 'cancelled') {
                    // User cancelled — do nothing
                  } else {
                    toast({ title: t.shopPurchaseError, description: t.shopPurchaseRetry, variant: "destructive" });
                  }
                } catch {
                  toast({ title: t.shopPurchaseError, variant: "destructive" });
                } finally {
                  setIsEssentialPurchasing(false);
                }
              }}
              disabled={isEssentialPurchasing}
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 hover:scale-105"
            >
              {isEssentialPurchasing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isEssentialPurchasing ? t.shopPurchasing : t.shopBuyEssential}
            </Button>

            <p className="text-center text-text-muted text-xs">{t.shopSecurePayment}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
        <TabsList className="ls-tabbar mb-8">
          <TabsTrigger value="modes" className="ls-tab">Modes</TabsTrigger>
          <TabsTrigger value="boosts" className="ls-tab">{t.boosts}</TabsTrigger>
          <TabsTrigger value="offers" className="ls-tab">{language === 'en' ? 'Offers' : language === 'es' ? 'Ofertas' : 'Offres'}</TabsTrigger>
        </TabsList>

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
                  id={`shop-mode-${mode.id}`}
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
                          {(mode as any).isTicketPack ? t.ticketPackFallingTunnel : mode.name}
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
                      {mode.description === '__fallingTunnelTicketDesc__' ? t.fallingTunnelTicketDesc : mode.description}
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
                          {t.buy4Tickets.replace('{price}', String(mode.price))}
                        </Button>
                          <Button 
                            onClick={async () => {
                              const success = await showRewardedAd('ticket');
                              if (success) {
                                toast({ title: t.ticketsReceived, description: t.ticketsReceivedDesc });
                                addTickets(5);
                                setCurrentTickets(getTickets());
                              }
                            }}
                            className="w-full bg-purple-500/20 border border-purple-500 text-purple-400 hover:bg-purple-500/30"
                            disabled={isAdShowing || !isAdReady() || cooldownRemaining > 0}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          {t.get5ByAd}
                          {cooldownRemaining > 0 && (
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
        <TabsContent value="offers">
          <ShopPaidOffers onPremium={() => setShowPremium(true)} onEssential={() => setShowEssentialPack(true)} onRainbow={() => setShowRainbow(true)} />
        </TabsContent>
      </Tabs>
      <PremiumOffer isOpen={showPremium} onClose={() => setShowPremium(false)} onAddCoins={onAddCoins} />
      <RainbowOffer isOpen={showRainbow} onClose={() => setShowRainbow(false)} />

      {/* Footer Info */}
      <div className="text-center mt-8 text-text-muted">
        <p>{t.earnCoinsHint}</p>
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
  const { language } = useLanguage();
  const t = translations[language];
  const { showRewardedAd, isShowing, isReady, getCooldown } = useRewardedAd();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    const updateCooldown = () => setCooldownRemaining(getCooldown());
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [getCooldown]);

  const canAfford = (price: number) => coins >= price;

  const handlePurchaseWithCoins = (boostId: any, price: number) => {
    if (!canAfford(price)) {
      toast({
        title: t.insufficientCoins,
        description: t.insufficientCoinsDesc.replace('{amount}', String(price)),
        variant: "destructive"
      });
      return;
    }

    // Utiliser le callback pour déduire les coins correctement
    if (onSpendCoins(price)) {
      addBoost(boostId);
      
      toast({
        title: t.boostPurchased,
        description: t.boostPurchasedDesc.replace('{name}', BOOSTS[boostId].name),
      });
    }
  };

  const handlePurchaseWithAd = async (boostId: any) => {
    const boostKindMap: Record<string, 'boost1' | 'boost2' | 'boost3'> = {
      'shield': 'boost1',
      'bigger_zone': 'boost2',
      'start_20': 'boost3',
      'revive': 'boost1',
    };
    const kind = boostKindMap[boostId];
    if (!kind) return;
    
    const success = await showRewardedAd(kind);
    if (success) {
      addBoost(boostId);
      toast({ title: t.boostReceivedShort, description: t.boostReceivedDesc.replace('{name}', BOOSTS[boostId].name).replace('{icon}', BOOSTS[boostId].icon) });
    }
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
                  disabled={isShowing || !isReady() || cooldownRemaining > 0}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Obtenir via pub
                  {cooldownRemaining > 0 && (
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