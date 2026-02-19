import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Backpack, Diamond, Ticket, Palette, Check, Pencil, X, Zap, Shield, Rocket, Target,
  Lock, ChevronRight, Crown, Star
} from 'lucide-react';
import { BOOSTS, BoostType } from '@/types/boosts';
import { getTickets } from '@/utils/ticketSystem';
import {
  getSeasonPassData,
  DECORATIONS,
  equipDecoration,
  equipUsernameColor,
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
  const { toast } = useToast();

  const identity = getLocalIdentity();

  useEffect(() => {
    if (isOpen) {
      setPassData(getSeasonPassData());
      setBoosts(getStoredBoosts());
      setTickets(getTickets());
      setNewUsername(identity.username || '');
    }
  }, [isOpen]);

  // Sync decoration to server
  const syncDecorationToServer = async (data: SeasonPassData) => {
    const { username, deviceId } = getLocalIdentity();
    if (!username) return;
    const parts: string[] = [];
    if (data.equippedDecoration && data.equippedDecoration !== 'purple_name') {
      parts.push(data.equippedDecoration);
    }
    if (data.equippedUsernameColor === 'violet') {
      parts.push('purple_name');
    }
    const decorations = parts.length > 0 ? parts.join(',') : null;
    try {
      await supabase.functions.invoke('sync-decoration', {
        body: { device_id: deviceId, username, decorations }
      });
    } catch (e) {
      console.warn('Decoration sync failed (offline?)', e);
    }
  };

  const handleEquip = (decoId: string | null) => {
    equipDecoration(decoId);
    const updated = getSeasonPassData();
    setPassData(updated);
    syncDecorationToServer(updated);
  };

  const handleEquipColor = (active: boolean) => {
    equipUsernameColor(active ? 'violet' : null);
    const updated = getSeasonPassData();
    setPassData(updated);
    syncDecorationToServer(updated);
  };

  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed.length < 3) {
      toast({ title: 'Pseudo trop court', description: 'Minimum 3 caractères.', variant: 'destructive' });
      return;
    }
    if (trimmed.length > 20) {
      toast({ title: 'Pseudo trop long', description: 'Maximum 20 caractères.', variant: 'destructive' });
      return;
    }
    // Check availability
    try {
      const result = await supabase.functions.invoke('check-username', {
        body: { username: trimmed }
      });
      if (result.data?.taken) {
        toast({ title: 'Pseudo déjà pris', description: 'Choisis un autre pseudo.', variant: 'destructive' });
        return;
      }
    } catch {}
    setUsername(trimmed);
    setEditingUsername(false);
    toast({ title: '✅ Pseudo mis à jour !', description: `Ton pseudo est maintenant "${trimmed}".` });
  };

  const unlockedDecorations = DECORATIONS.filter(d => passData.currentTier >= d.tier);
  const equippedDeco = DECORATIONS.find(d => d.id === passData.equippedDecoration);
  const hasVioletUnlocked = passData.currentTier >= 5;
  const isVioletEquipped = passData.equippedUsernameColor === 'violet';

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
                <Diamond className="w-4 h-4 text-primary" />
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
                onClick={() => setActiveTab('items')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  activeTab === 'items'
                    ? 'bg-gradient-to-r from-primary/80 to-secondary/80 text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> Objets
              </button>
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
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 240px)' }}>

          {/* ═══ ITEMS TAB ═══ */}
          {activeTab === 'items' && (
            <div className="px-4 pb-6 pt-2 space-y-4">

              {/* Username section */}
              <div className="relative overflow-hidden rounded-xl border border-wheel-border/50 bg-game-dark/40 p-3.5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Pencil className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-bold text-sm text-text-primary">Pseudo</span>
                </div>
                {editingUsername ? (
                  <div className="flex gap-2">
                    <input
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      maxLength={20}
                      className="flex-1 bg-game-darker border border-wheel-border/60 rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary/60"
                      placeholder="Nouveau pseudo..."
                      onKeyDown={e => e.key === 'Enter' && handleSaveUsername()}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUsername}
                      className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingUsername(false)}
                      className="w-9 h-9 rounded-lg bg-game-darker border border-wheel-border/40 flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-muted mb-0.5">Pseudo actuel</p>
                      <p
                        className="font-bold text-base"
                        style={{ color: isVioletEquipped ? '#a855f7' : 'hsl(var(--text-primary))' }}
                      >
                        {equippedDeco && !equippedDeco.isColorReward
                          ? `${equippedDeco.prefix}${identity.username || '—'}${equippedDeco.suffix}`
                          : (identity.username || '—')}
                      </p>
                    </div>
                    <button
                      onClick={() => { setNewUsername(identity.username || ''); setEditingUsername(true); }}
                      className="flex items-center gap-1.5 text-xs text-primary border border-primary/40 bg-primary/10 rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-colors font-semibold"
                    >
                      <Pencil className="w-3 h-3" /> Modifier
                    </button>
                  </div>
                )}
              </div>

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
            <div className="px-4 pb-6 pt-2 space-y-4">
              {unlockedDecorations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-game-dark border border-wheel-border/30 flex items-center justify-center mb-4">
                    <Lock className="w-7 h-7 text-text-muted/30" />
                  </div>
                  <p className="text-text-secondary text-sm font-semibold">Aucune décoration</p>
                  <p className="text-text-muted text-xs mt-1">Débloque des paliers dans le Pass de Saison !</p>
                  <Button
                    onClick={onClose}
                    size="sm"
                    className="mt-4 h-9 text-xs bg-gradient-to-r from-primary to-secondary text-game-darker font-bold rounded-xl"
                  >
                    <ChevronRight className="w-3.5 h-3.5" /> Voir le Pass
                  </Button>
                </div>
              ) : (
                <>
                  {/* Live preview */}
                  <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4 text-center">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/15 blur-2xl rounded-full" />
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 font-semibold">Aperçu classement</p>
                    <div className="relative text-2xl font-black py-1" style={{
                      color: isVioletEquipped ? '#a855f7' : 'hsl(var(--text-primary))'
                    }}>
                      {equippedDeco && !equippedDeco.isColorReward
                        ? `${equippedDeco.prefix}TonPseudo${equippedDeco.suffix}`
                        : 'TonPseudo'
                      }
                    </div>
                    {(equippedDeco || isVioletEquipped) ? (
                      <button
                        onClick={() => { handleEquip(null); handleEquipColor(false); }}
                        className="mt-2 text-[11px] text-text-muted hover:text-red-400 transition-colors underline underline-offset-2"
                      >
                        Retirer la décoration
                      </button>
                    ) : (
                      <p className="mt-1 text-[11px] text-text-muted">Appuie sur une décoration pour l'équiper</p>
                    )}
                  </div>

                  {/* Couleur pseudo violet */}
                  {hasVioletUnlocked && (
                    <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-3.5">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 blur-xl rounded-full" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Palette className="w-4 h-4 text-purple-400" />
                          </div>
                          <span className="font-bold text-sm text-text-primary">Couleur du pseudo</span>
                          <span className="text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-auto">Palier 5</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEquipColor(false)}
                            className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                              !isVioletEquipped
                                ? 'border-primary bg-primary/15 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.2)]'
                                : 'border-wheel-border/50 bg-game-dark/40 text-text-muted hover:border-wheel-border'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              {!isVioletEquipped && <Check className="w-3 h-3" />}
                              <span>Par défaut</span>
                              <span className="text-text-primary font-black text-sm">Pseudo</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleEquipColor(true)}
                            className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                              isVioletEquipped
                                ? 'border-purple-400 bg-purple-500/15 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                : 'border-wheel-border/50 bg-game-dark/40 hover:border-purple-500/40 hover:bg-purple-500/5'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              {isVioletEquipped && <Check className="w-3 h-3 text-purple-400" />}
                              <span className={isVioletEquipped ? 'text-purple-400' : 'text-text-muted'}>Violet</span>
                              <span className="font-black text-sm" style={{ color: '#a855f7' }}>Pseudo</span>
                            </div>
                          </button>
                        </div>
                        <p className="text-[10px] text-text-muted mt-2.5 text-center leading-relaxed">
                          🔄 La couleur se synchronise instantanément.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Decoration grid */}
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2.5 font-semibold px-0.5">
                      {unlockedDecorations.length} item{unlockedDecorations.length > 1 ? 's' : ''} débloqué{unlockedDecorations.length > 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {unlockedDecorations.map((deco) => {
                        if (deco.isColorReward) return null;
                        const isEquipped = passData.equippedDecoration === deco.id;
                        return (
                          <button
                            key={deco.id}
                            onClick={() => handleEquip(isEquipped ? null : deco.id)}
                            className={`relative rounded-xl border p-3.5 text-center transition-all duration-300 active:scale-95 ${
                              isEquipped
                                ? 'border-primary bg-primary/15 shadow-[0_0_16px_hsl(var(--primary)/0.25)]'
                                : 'border-wheel-border/50 bg-game-dark/40 hover:border-primary/40 hover:bg-primary/5'
                            }`}
                          >
                            {isEquipped && (
                              <div className="absolute -top-2 -right-2 bg-gradient-to-br from-primary to-secondary rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                                <Check className="w-3 h-3 text-game-darker" />
                              </div>
                            )}
                            <div className="text-3xl mb-2 leading-none">
                              {deco.prefix.trim() || deco.suffix.trim() || '🎨'}
                            </div>
                            <p className="text-xs font-bold text-text-primary leading-tight">{deco.name}</p>
                            <p className="text-[10px] text-text-muted mt-1 leading-tight truncate">
                              {deco.preview.replace('Pseudo', '···')}
                            </p>
                            <div className={`mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full inline-block ${
                              isEquipped ? 'bg-primary/20 text-primary' : 'bg-game-darker text-text-muted'
                            }`}>
                              Tier {deco.tier}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
