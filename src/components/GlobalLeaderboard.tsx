import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trophy, Medal, Award, Crown, Globe, Target, ChevronsDown, Gamepad2, Calendar, RefreshCw } from 'lucide-react';
import { fetchGlobalLeaderboard, fetchMonthlyGlobalLeaderboard, clearGlobalCache, GlobalPlayerScore } from '@/utils/globalScoresApi';
import { applyDecoration } from '@/utils/seasonPass';
import { getLocalIdentity } from '@/utils/localIdentity';
import { useToast } from '@/hooks/use-toast';
import { MonthlyTimer } from '@/components/MonthlyTimer';

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

interface LeaderboardListProps {
  data: GlobalPlayerScore[];
  loading: boolean;
  currentUsername: string;
  emptyIcon: React.ReactNode;
  emptyText: string;
  emptySubtext: string;
  scoreLabel: string;
}

const LeaderboardList: React.FC<LeaderboardListProps> = ({
  data, loading, currentUsername, emptyIcon, emptyText, emptySubtext, scoreLabel
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-8 text-center bg-button-bg border-wheel-border">
        {emptyIcon}
        <p className="text-text-muted">{emptyText}</p>
        <p className="text-text-muted text-sm">{emptySubtext}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((entry, index) => {
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
                    {(() => {
                      const displayName = entry.username.length > 12 ? `${entry.username.substring(0, 12)}...` : entry.username;
                      return applyDecoration(displayName, entry.decorations || null);
                    })()}
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
                <div className="text-[10px] text-text-muted">{scoreLabel}</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({ onBack }) => {
  const [selectedTab, setSelectedTab] = useState<string>('general');
  const [leaderboard, setLeaderboard] = useState<GlobalPlayerScore[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<GlobalPlayerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const { toast } = useToast();
  const currentUsername = getLocalIdentity().username;

  const loadGeneral = useCallback(async (force = false) => {
    if (force) clearGlobalCache();
    setLoading(true);
    try {
      const data = await fetchGlobalLeaderboard(1000);
      setLeaderboard(data);
    } catch {
      toast({
        title: "Erreur de connexion",
        description: "Impossible de charger le classement global.",
        variant: "destructive"
      });
    }
    setLoading(false);
  }, []);

  const loadMonthly = useCallback(async (force = false) => {
    if (force) clearGlobalCache();
    setMonthlyLoading(true);
    try {
      const data = await fetchMonthlyGlobalLeaderboard(1000);
      setMonthlyLeaderboard(data);
    } catch {
      toast({
        title: "Erreur de connexion",
        description: "Impossible de charger le classement mensuel.",
        variant: "destructive"
      });
    }
    setMonthlyLoading(false);
  }, []);

  useEffect(() => {
    loadGeneral();
  }, []);

  useEffect(() => {
    if (selectedTab === 'monthly') {
      loadMonthly();
    }
  }, [selectedTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    clearGlobalCache();
    if (selectedTab === 'general') {
      await loadGeneral(true);
    } else {
      await loadMonthly(true);
    }
    setRefreshing(false);
    toast({
      title: "Classement actualisé",
      description: "Les scores ont été mis à jour.",
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      setIsAtTop(scrollTop < 50);
      setShowScrollButton(scrollHeight > clientHeight + 100);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [leaderboard, monthlyLeaderboard]);

  const handleScrollButton = () => {
    if (isAtTop) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const activeData = selectedTab === 'general' ? leaderboard : monthlyLeaderboard;
  const userRank = currentUsername
    ? activeData.findIndex(e => e.username.toLowerCase() === currentUsername.toLowerCase()) + 1
    : 0;

  return (
    <div className="min-h-screen bg-gradient-game theme-neon flex flex-col pt-12">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center mb-4">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="border-wheel-border hover:bg-button-hover"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Globe className="w-8 h-8 text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]" />
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              CLASSEMENT GLOBAL
            </h1>
          </div>
          <p className="text-text-secondary text-sm max-w-xs mx-auto">
            {selectedTab === 'general'
              ? 'Comment ça marche ? Ton meilleur score de chaque mode est additionné pour former ton Score Global. Joue à tous les modes pour monter dans le classement !'
              : 'Comment ça marche ? Ton meilleur score de chaque mode ce mois-ci est additionné pour former ton Score Mensuel. Le classement se réinitialise le 1er de chaque mois !'
            }
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-2 bg-button-bg border border-wheel-border">
            <TabsTrigger
              value="general"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-text-primary"
            >
              <Globe className="w-4 h-4" />
              Général
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-text-primary"
            >
              <Calendar className="w-4 h-4" />
              Mensuel
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Monthly timer */}
        {selectedTab === 'monthly' && (
          <div className="flex justify-center mb-4">
            <MonthlyTimer />
          </div>
        )}

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
                    {activeData[userRank - 1]?.modes_played || 0}/6 modes joués
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-primary font-bold text-lg">{activeData[userRank - 1]?.total_score || 0}</div>
                <div className="text-[10px] text-text-muted">
                  {selectedTab === 'general' ? 'Score Global' : 'Score Mensuel'}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Leaderboard */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsContent value="general" className="mt-0">
            <LeaderboardList
              data={leaderboard}
              loading={loading}
              currentUsername={currentUsername || ''}
              emptyIcon={<Globe className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />}
              emptyText="Aucun score enregistré"
              emptySubtext="Soyez le premier à jouer !"
              scoreLabel="pts cumulés"
            />
          </TabsContent>
          <TabsContent value="monthly" className="mt-0">
            <LeaderboardList
              data={monthlyLeaderboard}
              loading={monthlyLoading}
              currentUsername={currentUsername || ''}
              emptyIcon={<Calendar className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />}
              emptyText="Aucun score ce mois-ci"
              emptySubtext="Joue une partie pour apparaître !"
              scoreLabel="pts ce mois"
            />
          </TabsContent>
        </Tabs>
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
