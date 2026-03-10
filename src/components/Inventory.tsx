import React, { useState, useEffect, useRef } from 'react';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { trackSent, trackSkipped } from '@/utils/edgeFunctionMetrics';
import { Button } from '@/components/ui/button';
import {
  Backpack, Ticket, Palette, Check, Pencil, X, Zap, Shield, Rocket, Target,
  Lock, ChevronRight, Crown, Star
} from 'lucide-react';
import { BOOSTS, BoostType } from '@/types/boosts';
import { getTickets } from '@/utils/ticketSystem';
import {
  getSeasonPassData,
  DECORATIONS,
  equipDecoration,
  equipUsernameColor,
  hasGoldPulseUnlocked as checkGoldPulse,
  type SeasonPassData,
} from '@/utils/seasonPass';
import { getLocalIdentity, setUsername } from '@/utils/localIdentity';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const BOOST_ICONS: Record<BoostType, React.ReactNode> = {
  shield: <Shield className="w-5 h-5 text-blue-400" />,
  bigger_zone: <Target className="w-5 h-5 text-green-400" />,
  start_20: <Rocket className="w-5 h-5 text-orange-400" />,
};

const getStoredBoosts = (): Record<string, number> => {
  try {
    const saved = localStorage.getItem('luckyStopBoosts');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const Inventory: React.FC<InventoryProps> = ({ isOpen, onClose }) => {
  const [passData, setPassData] = useState<SeasonPassData>(getSeasonPassData());
  const [boosts, setBoosts] = useState<Record<string, number>>(getStoredBoosts());
  const [tickets, setTickets] = useState(getTickets());
  const [activeTab, setActiveTab] = useState<'items' | 'decos'>('items');
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [previewDeco, setPreviewDeco] = useState<string | null>(null); // preview locked deco
  const [previewColor, setPreviewColor] = useState<'violet' | 'pulse' | 'gold_pulse' | null>(null); // preview locked color
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];

  const identity = getLocalIdentity();

  useEffect(() => {
    if (isOpen) {
      setPassData(getSeasonPassData());
      setBoosts(getStoredBoosts());
      setTickets(getTickets());
      setNewUsername(identity.username || '');
      setPreviewDeco(null);
      setPreviewColor(null);
    }
  }, [isOpen]);

  // Sync decoration to server — with skip-if-same and single-inflight guards
  const lastSyncedDecoration = useRef<string | null | undefined>(undefined);
  const isSyncingDecoration = useRef(false);

  const syncDecorationToServer = async (data: SeasonPassData) => {
    const { username, deviceId } = getLocalIdentity();
    if (!username) return;
    const parts: string[] = [];
    if (data.equippedDecoration && data.equippedDecoration !== 'purple_name' && data.equippedDecoration !== 'pulse_name' && data.equippedDecoration !== 'gold_pulse_name') {
      parts.push(data.equippedDecoration);
    }
    if (data.equippedUsernameColor === 'violet') {
      parts.push('purple_name');
    }
    if (data.equippedUsernameColor === 'pulse') {
      parts.push('pulse_name');
    }
    if (data.equippedUsernameColor === 'gold_pulse') {
      parts.push('gold_pulse_name');
    }
    const decorations = parts.length > 0 ? parts.join(',') : null;

    // Skip if identical to last synced value
    if (lastSyncedDecoration.current !== undefined && lastSyncedDecoration.current === decorations) {
      trackSkipped('sync-decoration', 'same-value');
      return;
    }

    // Skip if already syncing
    if (isSyncingDecoration.current) {
      trackSkipped('sync-decoration', 'already-inflight');
      return;
    }

    isSyncingDecoration.current = true;
    try {
      trackSent('sync-decoration');
      await supabase.functions.invoke('sync-decoration', {
        body: { device_id: deviceId, username, decorations }
      });
      lastSyncedDecoration.current = decorations;
    } catch (e) {
      console.warn('Decoration sync failed (offline?)', e);
    } finally {
      isSyncingDecoration.current = false;
    }
  };

  const handleEquip = (decoId: string | null) => {
    setPreviewDeco(null);
    setPreviewColor(null);
    equipDecoration(decoId);
    const updated = getSeasonPassData();
    setPassData(updated);
    syncDecorationToServer(updated);
  };

  const handleEquipColor = (color: 'violet' | 'pulse' | 'gold_pulse' | null) => {
    setPreviewDeco(null);
    setPreviewColor(null);
    equipUsernameColor(color);
    const updated = getSeasonPassData();
    setPassData(updated);
    syncDecorationToServer(updated);
  };

  const handlePreviewDeco = (decoId: string) => {
    setPreviewDeco(decoId || null);
    // Don't reset previewColor — allow combining color + emoji in preview
  };

  const handlePreviewColor = (color: 'violet' | 'pulse' | 'gold_pulse') => {
    setPreviewColor(color);
    // Don't reset previewDeco — allow combining emoji + color in preview
  };

  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed.length < 3) {
      toast({ title: t.inventoryUsernameTooShort, description: t.inventoryUsernameTooShortDesc, variant: 'destructive' });
      return;
    }
    if (trimmed.length > 20) {
      toast({ title: t.inventoryUsernameTooLong, description: t.inventoryUsernameTooLongDesc, variant: 'destructive' });
      return;
    }
    // Check availability
    try {
      const result = await supabase.functions.invoke('check-username', {
        body: { username: trimmed }
      });
      if (result.data?.taken) {
        toast({ title: t.inventoryUsernameTaken, description: t.inventoryUsernameTakenDesc, variant: 'destructive' });
        return;
      }
    } catch {}
    setUsername(trimmed);
    setEditingUsername(false);
    toast({ title: t.inventoryUsernameUpdated, description: t.inventoryUsernameUpdatedDesc.replace('{name}', trimmed) });
  };

  const unlockedDecorations = DECORATIONS.filter(d => passData.currentTier >= d.tier);
  const equippedDeco = DECORATIONS.find(d => d.id === passData.equippedDecoration);
  const hasVioletUnlocked = passData.currentTier >= 4;
  const hasPulseUnlocked = passData.currentTier >= 9;
  const hasGoldPulseUnlocked = checkGoldPulse();
  const isVioletEquipped = passData.equippedUsernameColor === 'violet';
  const isPulseEquipped = passData.equippedUsernameColor === 'pulse';
  const isGoldPulseEquipped = passData.equippedUsernameColor === 'gold_pulse';

  // Preview state: if previewing something locked, show it in the preview area
  const isPreviewingLocked = previewDeco !== null || previewColor !== null;
  const previewDecoObj = previewDeco ? DECORATIONS.find(d => d.id === previewDeco) : null;
  const displayDeco = previewDecoObj || equippedDeco;
  const displayViolet = previewColor === 'violet' || (previewColor === null && isVioletEquipped);
  const displayPulse = previewColor === 'pulse' || (previewColor === null && isPulseEquipped);
  const displayGoldPulse = previewColor === 'gold_pulse' || (previewColor === null && isGoldPulseEquipped);

  const totalBoosts = Object.values(boosts).reduce((a, b) => a + b, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-game-darker border-wheel-border max-w-sm max-h-[90vh] overflow-hidden p-0 gap-0 rounded-2xl">

        {/* HEADER */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-primary/20 blur-2xl rounded-full" />
          <div className="relative px-5 pt-5 pb-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Backpack className="w-5 h-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" />
              <h2 className="text-lg font-extrabold tracking-wide text-text-primary uppercase">Inventaire</h2>
              <Backpack className="w-5 h-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" />
            </div>

            {/* Resources row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {/* Diamonds */}
              <div className="flex flex-col items-center gap-1 bg-game-dark/70 border border-wheel-border/40 rounded-xl py-2.5 px-1">
                <span className="text-base">💎</span>
                <span className="text-lg font-black text-text-primary">{passData.diamonds}</span>
                <span className="text-[9px] text-text-muted uppercase tracking-wide">Diamants</span>
              </div>
              {/* Tickets */}
              <div className="flex flex-col items-center gap-1 bg-game-dark/70 border border-wheel-border/40 rounded-xl py-2.5 px-1">
                <Ticket className="w-4 h-4 text-secondary" />
                <span className="text-lg font-black text-text-primary">{tickets}</span>
                <span className="text-[9px] text-text-muted uppercase tracking-wide">Tickets</span>
              </div>
              {/* Boosts total */}
              <div className="flex flex-col items-center gap-1 bg-game-dark/70 border border-wheel-border/40 rounded-xl py-2.5 px-1">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-lg font-black text-text-primary">{totalBoosts}</span>
                <span className="text-[9px] text-text-muted uppercase tracking-wide">Boosts</span>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-game-dark/60 border border-wheel-border/50 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab('decos')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  activeTab === 'decos'
                    ? 'bg-gradient-to-r from-primary/80 to-secondary/80 text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Palette className="w-3.5 h-3.5" /> Décorations
                {unlockedDecorations.length > 0 && (
                  <span className="bg-secondary/80 text-text-primary text-[9px] font-bold rounded-full px-1.5 py-0 min-w-[16px] text-center">
                    {unlockedDecorations.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  activeTab === 'items'
                    ? 'bg-gradient-to-r from-primary/80 to-secondary/80 text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> Objets
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 240px)' }}>

          {/* ═══ ITEMS TAB ═══ */}
          {activeTab === 'items' && (
            <div className="px-4 pb-6 pt-2 space-y-4">

              {/* Boosts section */}
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2.5 font-semibold px-0.5 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-orange-400" /> Boosts
                </p>
                <div className="space-y-2">
                  {(Object.keys(BOOSTS) as BoostType[]).map(boostId => {
                    const boost = BOOSTS[boostId];
                    const count = boosts[boostId] || 0;
                    return (
                      <div
                        key={boostId}
                        className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all ${
                          count > 0
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-wheel-border/30 bg-game-dark/30 opacity-60'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-game-darker border border-wheel-border/40 flex items-center justify-center text-xl shrink-0">
                          {boost.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-text-primary leading-tight">{boost.name}</p>
                          <p className="text-[10px] text-text-muted truncate">{boost.description}</p>
                        </div>
                        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm border ${
                          count > 0
                            ? 'bg-primary/20 border-primary/40 text-primary'
                            : 'bg-game-darker border-wheel-border/30 text-text-muted'
                        }`}>
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tickets section */}
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2.5 font-semibold px-0.5 flex items-center gap-1.5">
                  <Ticket className="w-3 h-3 text-secondary" /> Tickets de mode
                </p>
                <div className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
                  tickets > 0 ? 'border-secondary/30 bg-secondary/5' : 'border-wheel-border/30 bg-game-dark/30 opacity-60'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-game-darker border border-wheel-border/40 flex items-center justify-center text-xl shrink-0">
                    🎫
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-text-primary">Ticket Partie</p>
                    <p className="text-[10px] text-text-muted">Permet de jouer sur les modes premium</p>
                  </div>
                  <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm border ${
                    tickets > 0
                      ? 'bg-secondary/20 border-secondary/40 text-secondary'
                      : 'bg-game-darker border-wheel-border/30 text-text-muted'
                  }`}>
                    {tickets}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ DECOS TAB ═══ */}
          {activeTab === 'decos' && (
            <div className="pb-6 pt-2 space-y-5">
              {/* ── Live Preview ── */}
              <div className="relative mx-4 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-game-dark/60 to-secondary/5">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-20 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
                <div className="relative px-4 pt-5 pb-4 flex flex-col items-center gap-1">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-bold mb-1">
                    {isPreviewingLocked ? '👁️ Prévisualisation' : 'Aperçu dans le classement'}
                  </span>
                  {isPreviewingLocked && (
                    <span className="text-[9px] text-yellow-400/80 font-semibold">🔒 Non débloqué — aperçu uniquement</span>
                  )}
                  {!isPreviewingLocked && (
                    <span className="text-[9px] text-text-muted italic">⚡ Joue une partie pour appliquer les changements</span>
                  )}
                  <div
                    className={`text-[28px] font-black leading-tight tracking-wide ${displayPulse ? 'animate-[username-pulse_3s_ease-in-out_infinite]' : ''} ${displayGoldPulse ? 'animate-[username-gold-pulse_3s_ease-in-out_infinite]' : ''} ${isPreviewingLocked ? 'opacity-70' : ''}`}
                    style={{
                      color: displayViolet ? '#a855f7' : displayPulse ? 'hsl(var(--primary))' : displayGoldPulse ? 'hsl(45, 100%, 55%)' : 'hsl(var(--text-primary))'
                    }}
                  >
                    {displayDeco && !displayDeco.isColorReward
                      ? `${displayDeco.prefix}${identity.username || 'TonPseudo'}${displayDeco.suffix}`
                      : (identity.username || 'TonPseudo')
                    }
                  </div>
                  {isPreviewingLocked ? (
                    <button
                      onClick={() => { setPreviewDeco(null); setPreviewColor(null); }}
                      className="mt-2 text-[10px] text-yellow-400/70 hover:text-yellow-400 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Fermer l'aperçu
                    </button>
                  ) : (equippedDeco || isVioletEquipped || isPulseEquipped || isGoldPulseEquipped) ? (
                    <button
                      onClick={() => { handleEquip(null); handleEquipColor(null); }}
                      className="mt-2 text-[10px] text-text-muted hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Retirer la décoration
                    </button>
                  ) : (
                    <p className="text-[10px] text-text-muted mt-1">Sélectionne une décoration ci-dessous</p>
                  )}
                  <p className="text-[8px] text-text-muted/60 mt-1.5 italic">👆 Clique sur un élément verrouillé pour le prévisualiser</p>
                </div>
              </div>

              {/* ── Couleur pseudo ── */}
              <div className="px-4">
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-3 font-bold flex items-center gap-1.5">
                  <Palette className="w-3 h-3" /> Couleur du pseudo
                </p>
                <div className="flex gap-2.5">
                  {/* Default */}
                  <button
                    onClick={() => handleEquipColor(null)}
                    className={`flex-1 relative overflow-hidden rounded-2xl border-2 py-3.5 transition-all duration-300 active:scale-95 ${
                      !isVioletEquipped && !isPulseEquipped && !isGoldPulseEquipped
                        ? 'border-primary shadow-[0_0_16px_hsl(var(--primary)/0.35)]'
                        : 'border-wheel-border/40'
                    }`}
                  >
                    {!isVioletEquipped && !isPulseEquipped && !isGoldPulseEquipped && <div className="absolute inset-0 bg-primary/10" />}
                    <div className="relative flex flex-col items-center gap-1">
                      {!isVioletEquipped && !isPulseEquipped && !isGoldPulseEquipped && (
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-game-darker" />
                        </div>
                      )}
                      <span className="text-[10px] font-black text-text-primary">Défaut</span>
                      <span className="text-sm font-black text-text-primary leading-none">Aa</span>
                    </div>
                  </button>

                  {/* Violet */}
                  <button
                    onClick={() => hasVioletUnlocked ? handleEquipColor('violet') : handlePreviewColor('violet')}
                    className={`flex-1 relative overflow-hidden rounded-2xl border-2 py-3.5 transition-all duration-300 active:scale-95 ${
                      isVioletEquipped
                        ? 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        : previewColor === 'violet'
                          ? 'border-purple-400/50 border-dashed'
                          : 'border-wheel-border/40'
                    }`}
                  >
                    {isVioletEquipped && <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-900/10" />}
                    <div className="relative flex flex-col items-center gap-1">
                      {isVioletEquipped && (
                        <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      {!hasVioletUnlocked && <Lock className="w-3 h-3 text-text-muted" />}
                      <span className={`text-[10px] font-black ${isVioletEquipped ? 'text-purple-300' : 'text-text-muted'}`}>Violet</span>
                      <span className="text-sm font-black leading-none" style={{ color: '#a855f7' }}>Aa</span>
                      {!hasVioletUnlocked && <span className="text-[8px] text-text-muted">Tier 5</span>}
                    </div>
                  </button>

                  {/* Pulse */}
                  <button
                    onClick={() => hasPulseUnlocked ? handleEquipColor('pulse') : handlePreviewColor('pulse')}
                    className={`flex-1 relative overflow-hidden rounded-2xl border-2 py-3.5 transition-all duration-300 active:scale-95 ${
                      isPulseEquipped
                        ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.4)]'
                        : previewColor === 'pulse'
                          ? 'border-primary/50 border-dashed'
                          : 'border-wheel-border/40'
                    }`}
                  >
                    {isPulseEquipped && <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/10" />}
                    <div className="relative flex flex-col items-center gap-1">
                      {isPulseEquipped && (
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-game-darker" />
                        </div>
                      )}
                      {!hasPulseUnlocked && <Lock className="w-3 h-3 text-text-muted" />}
                      <span className={`text-[10px] font-black ${isPulseEquipped ? 'text-primary' : 'text-text-muted'}`}>Pulsé</span>
                      <span className="text-base font-black leading-none animate-[username-pulse_3s_ease-in-out_infinite] drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]" style={{ color: 'hsl(var(--primary))' }}>Aa</span>
                      {!hasPulseUnlocked && <span className="text-[8px] text-text-muted">Tier 10</span>}
                    </div>
                  </button>

                  {/* Gold Pulse */}
                  <button
                    onClick={() => hasGoldPulseUnlocked ? handleEquipColor('gold_pulse') : handlePreviewColor('gold_pulse')}
                    className={`flex-1 relative overflow-hidden rounded-2xl border-2 py-3.5 transition-all duration-300 active:scale-95 ${
                      isGoldPulseEquipped
                        ? 'border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                        : previewColor === 'gold_pulse'
                          ? 'border-yellow-400/50 border-dashed'
                          : 'border-wheel-border/40'
                    }`}
                  >
                    {isGoldPulseEquipped && <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-amber-900/10" />}
                    <div className="relative flex flex-col items-center gap-1">
                      {isGoldPulseEquipped && (
                        <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-game-darker" />
                        </div>
                      )}
                      {!hasGoldPulseUnlocked && <Lock className="w-3 h-3 text-text-muted" />}
                      <span className={`text-[10px] font-black ${isGoldPulseEquipped ? 'text-yellow-400' : 'text-text-muted'}`}>Or Pulsé</span>
                      <span className="text-base font-black leading-none animate-[username-gold-pulse_3s_ease-in-out_infinite] drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]" style={{ color: 'hsl(45, 100%, 55%)' }}>Aa</span>
                      {!hasGoldPulseUnlocked && <span className="text-[8px] text-yellow-400/60 font-bold">Pack Premium</span>}
                    </div>
                  </button>
                </div>
              </div>

              {/* ── Décorations list ── */}
              <div className="px-4">
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2.5 font-bold flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-yellow-400" />
                  {unlockedDecorations.filter(d => !d.isColorReward).length} / {DECORATIONS.filter(d => !d.isColorReward).length} débloquée{unlockedDecorations.filter(d => !d.isColorReward).length > 1 ? 's' : ''}
                </p>
                <div className="space-y-1.5">
                  {DECORATIONS.filter(d => !d.isColorReward).map((deco) => {
                    const isUnlocked = passData.currentTier >= deco.tier;
                    const isEquipped = isUnlocked && passData.equippedDecoration === deco.id;
                    const isPreviewing = !isUnlocked && previewDeco === deco.id;
                    return (
                      <button
                        key={deco.id}
                        onClick={() => {
                          if (isUnlocked) {
                            handleEquip(isEquipped ? null : deco.id);
                          } else {
                            handlePreviewDeco(previewDeco === deco.id ? '' : deco.id);
                            if (previewDeco === deco.id) { setPreviewDeco(null); }
                          }
                        }}
                        className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                          isEquipped
                            ? 'border-primary/50 bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
                            : isPreviewing
                              ? 'border-primary/30 border-dashed bg-primary/5'
                              : isUnlocked
                                ? 'border-wheel-border/30 bg-game-dark/40 active:scale-[0.98]'
                                : 'border-wheel-border/20 bg-game-dark/20 opacity-60'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-game-darker border border-wheel-border/40 flex items-center justify-center text-lg shrink-0">
                          {deco.prefix.trim() || deco.suffix.trim() || '🎨'}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-bold text-text-primary leading-tight">{deco.name}</p>
                          <p className="text-[10px] text-text-muted truncate">{deco.preview.replace('Pseudo', '···')}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                            isEquipped
                              ? 'border-primary/40 bg-primary/15 text-primary'
                              : 'border-wheel-border/30 bg-game-darker text-text-muted'
                          }`}>T{deco.tier}</span>
                          {isEquipped && (
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-game-darker" />
                            </div>
                          )}
                          {!isUnlocked && <Lock className="w-3.5 h-3.5 text-text-muted" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
