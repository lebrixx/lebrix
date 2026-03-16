import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Medal, Award, Crown, Globe, Target, ChevronsDown, Gamepad2, Info } from 'lucide-react';
import { fetchGlobalLeaderboard, GlobalPlayerScore } from '@/utils/globalScoresApi';
import { getLocalIdentity } from '@/utils/localIdentity';
import { useToast } from '@/hooks/use-toast';

interface GlobalLeaderboardProps {
  onBack: () => void;
}

const hasPurpleName = (decorations: string | null | undefined): boolean => {
  if (!decorations) return false;
  return decorations.split(',').map(d => d.trim()).includes('purple_name');
};

const hasPulseName = (decorations: string | null | undefined): boolean => {
  if (!decorations) return false;
  return decorations.split(',').map(d => d.trim()).includes('pulse_name');
};

const hasGoldPulseName = (decorations: string | null | undefined): boolean => {
  if (!decorations) return false;
  return decorations.split(',').map(d => d.trim()).includes('gold_pulse_name');
};

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({ onBack }) => {
  const [leaderboard, setLeaderboard] = useState<GlobalPlayerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const { toast } = useToast();
  const currentUsername = getLocalIdentity().username;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchGlobalLeaderboard(100);
        setLeaderboard(data);
      } catch (error: any) {
        toast({
          title: "Erreur de connexion",
          description: "Impossible de charger le classement global.",
          variant: "destructive"
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      setIsAtTop(scrollTop < 50);
      setShowScrollButton(scrollHeight > clientHeight + 100);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [leaderboard]);

  const handleScrollButton = () => {
    if (isAtTop) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400 drop-shadow-[0_0_6px_rgba(156,163,175,0.5)]" />;
      case 3: return <Award className="w-6 h-6 text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.5)]" />;
      default: return <Trophy className="w-5 h-5 text-primary" />;
    }
  };

  const getRankStyle = (position: number) => {
    switch (position) {
      case 1: return 'border-yellow-500/40 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.15)]';
      case 2: return 'border-gray-400/40 bg-gray-400/5 shadow-[0_0_15px_rgba(156,163,175,0.1)]';
      case 3: return 'border-amber-600/40 bg-amber-600/5 shadow-[0_0_15px_rgba(217,119,6,0.1)]';
      default: return 'border-wheel-border bg-button-bg';
    }
  };

  const getUsernameClass = (decorations: string | null | undefined) => {
    if (hasGoldPulseName(decorations)) return 'font-bold text-yellow-400 animate-pulse';
    if (hasPulseName(decorations)) return 'font-bold text-primary animate-pulse';
    if (hasPurpleName(decorations)) return 'font-bold text-violet-400';
    return 'font-bold text-text-primary';
  };

  // Find current user rank
  const userRank = currentUsername
    ? leaderboard.findIndex(e => e.username.toLowerCase() === currentUsername.toLowerCase()) + 1
    : 0;

  return (
    <div className="min-h-screen bg-gradient-game theme-neon flex flex-col pt-12">
      {/* Header */}
      <div className="p-4 pb-0">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="mb-4 border-wheel-border hover:bg-button-hover"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Globe className="w-8 h-8 text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]" />
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              CLASSEMENT GLOBAL
            </h1>
          </div>
          <p className="text-text-secondary text-sm max-w-xs mx-auto">
            Le score total de chaque joueur est la somme de ses meilleurs scores dans chaque mode de jeu
          </p>
        </div>

        {/* Info banner */}
        <Card className="bg-primary/5 border-primary/20 p-3 mb-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-text-secondary">
              <span className="text-primary font-semibold">Comment ça marche ?</span> Ton meilleur score de chaque mode (Classique, Arc Changeant, Survie, Zone Mobile, Zone Traîtresse, Mémoire) est additionné pour former ton <span className="text-primary font-semibold">Score Global</span>. Joue à tous les modes pour monter dans le classement !
            </div>
          </div>
        </Card>

        {/* User rank bubble */}
        {currentUsername && userRank > 0 && (
          <Card className="bg-primary/10 border-primary/30 p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">#{userRank}</span>
                </div>
                <div>
                  <span className="text-text-primary font-bold text-sm">{currentUsername}</span>
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Gamepad2 className="w-3 h-3" />
                    {leaderboard[userRank - 1]?.modes_played || 0}/6 modes joués
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-primary font-bold text-lg">{leaderboard[userRank - 1]?.total_score || 0}</div>
                <div className="text-[10px] text-text-muted">Score Global</div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Leaderboard */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="p-8 text-center bg-button-bg border-wheel-border">
            <Globe className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
            <p className="text-text-muted">Aucun score enregistré</p>
            <p className="text-text-muted text-sm">Soyez le premier à jouer !</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = currentUsername?.toLowerCase() === entry.username.toLowerCase();
              return (
                <Card
                  key={`${entry.username}-${index}`}
                  className={`p-3 transition-all duration-300 hover:scale-[1.02] ${getRankStyle(index + 1)} ${
                    isCurrentUser ? 'ring-1 ring-primary/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 min-w-[60px]">
                        {getRankIcon(index + 1)}
                        <Badge
                          variant={index < 3 ? "default" : "outline"}
                          className={`font-bold text-xs ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                            index === 1 ? 'bg-gray-400/20 text-gray-400 border-gray-400/30' :
                            index === 2 ? 'bg-amber-600/20 text-amber-600 border-amber-600/30' :
                            ''
                          }`}
                        >
                          #{index + 1}
                        </Badge>
                      </div>
                      <div>
                        <h3 className={`text-sm ${getUsernameClass(entry.decorations)}`}>
                          {entry.username}
                          {isCurrentUser && <span className="text-[10px] text-primary ml-1">(toi)</span>}
                        </h3>
                        <div className="flex items-center gap-1 text-[10px] text-text-muted">
                          <Gamepad2 className="w-3 h-3" />
                          {entry.modes_played}/6 modes
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-primary" />
                        <span className={`font-bold text-lg ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-amber-600' :
                          'text-primary'
                        }`}>
                          {entry.total_score.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-muted">pts cumulés</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Scroll Button */}
      {showScrollButton && (
        <Button
          onClick={handleScrollButton}
          size="icon"
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-button-bg/40 border border-wheel-border/50 hover:bg-button-bg/60 shadow-lg backdrop-blur-sm transition-all hover:scale-110 z-50"
        >
          <ChevronsDown className={`w-4 h-4 text-primary/70 transition-transform ${isAtTop ? '' : 'rotate-180'}`} />
        </Button>
      )}
    </div>
  );
};
