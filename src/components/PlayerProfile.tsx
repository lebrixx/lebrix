import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, Star, TrendingUp, Award, Edit2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { getLocalIdentity } from '@/utils/localIdentity';

interface PlayerProfileProps {
  onBack: () => void;
}

interface LeaderboardEntry {
  mode: string;
  rank: number;
  score: number;
  total_players: number;
}

interface LocalLeaderboardEntry {
  mode: string;
  rank: number;
  score: number;
  total_players: number;
  type: 'global' | 'weekly';
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ onBack }) => {
  const { profile, isAuthenticated } = useAuth();
  const { playerLevel, calculateXpForLevel } = usePlayerLevel();
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [localLeaderboardEntries, setLocalLeaderboardEntries] = useState<LocalLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');

  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);

      // Get username from localStorage
      const localIdentity = getLocalIdentity();
      setUsername(localIdentity.username || 'Joueur');

      // Fetch leaderboard rankings from scores table (local)
      const localDeviceId = localIdentity.deviceId;
      
      // Get player's scores from scores table
      const { data: scoresData } = await supabase
        .from('scores')
        .select('mode, score, created_at')
        .eq('device_id', localDeviceId)
        .order('score', { ascending: false });

      if (scoresData && scoresData.length > 0) {
        const modes = ['classic', 'arc_changeant', 'survie_60s', 'zone_mobile', 'zone_traitresse'];
        const allEntries: LocalLeaderboardEntry[] = [];

        for (const mode of modes) {
          const modeScores = scoresData.filter(s => s.mode === mode);
          if (modeScores.length === 0) continue;

          const bestScore = Math.max(...modeScores.map(s => s.score));

          // Get global rank
          const { count: higherScoresCount } = await supabase
            .from('scores')
            .select('*', { count: 'exact', head: true })
            .eq('mode', mode)
            .gt('score', bestScore);

          const globalRank = (higherScoresCount || 0) + 1;

          const { count: totalPlayers } = await supabase
            .from('scores')
            .select('*', { count: 'exact', head: true })
            .eq('mode', mode);

          // Only show if in top 100
          if (globalRank <= 100) {
            allEntries.push({
              mode,
              rank: globalRank,
              score: bestScore,
              total_players: totalPlayers || 0,
              type: 'global'
            });
          }

          // Get weekly rank
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          const { count: higherWeeklyScoresCount } = await supabase
            .from('scores')
            .select('*', { count: 'exact', head: true })
            .eq('mode', mode)
            .gt('score', bestScore)
            .gte('created_at', oneWeekAgo.toISOString());

          const weeklyRank = (higherWeeklyScoresCount || 0) + 1;

          const { count: totalWeeklyPlayers } = await supabase
            .from('scores')
            .select('*', { count: 'exact', head: true })
            .eq('mode', mode)
            .gte('created_at', oneWeekAgo.toISOString());

          // Only show if in top 50 weekly
          if (weeklyRank <= 50) {
            allEntries.push({
              mode,
              rank: weeklyRank,
              score: bestScore,
              total_players: totalWeeklyPlayers || 0,
              type: 'weekly'
            });
          }
        }

        setLocalLeaderboardEntries(allEntries);
      }

      setLoading(false);
    };

    fetchPlayerData();
  }, [profile, isAuthenticated]);

  const handleUsernameChange = () => {
    if (tempUsername.trim()) {
      const localIdentity = getLocalIdentity();
      localIdentity.username = tempUsername.trim();
      localStorage.setItem('localIdentity', JSON.stringify(localIdentity));
      setUsername(tempUsername.trim());
      setIsEditingUsername(false);
    }
  };

  const xpNeeded = calculateXpForLevel(playerLevel.level);
  const xpProgress = playerLevel.level >= 100 ? 100 : (playerLevel.current_xp / xpNeeded) * 100;

  const getModeDisplayName = (mode: string): string => {
    return mode.replace(/_/g, ' ').toUpperCase();
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank <= 3) return 'secondary';
    if (rank <= 10) return 'outline';
    return 'outline';
  };

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="hover:bg-primary/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>

      {/* Player Level Card */}
      <Card className="bg-button-bg border-wheel-border p-6 mb-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {isEditingUsername ? (
                <div className="flex gap-2 items-center">
                  <Input
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    placeholder="Votre pseudo"
                    className="max-w-[200px]"
                    maxLength={20}
                  />
                  <Button size="sm" onClick={handleUsernameChange}>
                    OK
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingUsername(false)}>
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-primary">{username}</h2>
                  {!isAuthenticated && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0"
                      onClick={() => {
                        setTempUsername(username);
                        setIsEditingUsername(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
              <p className="text-sm text-text-muted">
                {isAuthenticated ? 'Compte connecté' : 'Profil local'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-1">{playerLevel.level}</div>
              <Badge variant="secondary" className="bg-secondary text-game-dark">
                {playerLevel.level >= 100 ? 'MAX' : 'NIVEAU'}
              </Badge>
            </div>
          </div>

          {/* XP Progress */}
          {playerLevel.level < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Progression</span>
                <span className="text-primary font-bold">
                  {playerLevel.current_xp.toLocaleString()} / {xpNeeded.toLocaleString()} XP
                </span>
              </div>
              <Progress value={xpProgress} className="h-3" />
              <div className="flex justify-between text-xs text-text-muted">
                <span>Niveau {playerLevel.level}</span>
                <span>Niveau {playerLevel.level + 1}</span>
              </div>
            </div>
          )}

          {playerLevel.level >= 100 && (
            <div className="text-center py-4">
              <Award className="w-12 h-12 text-secondary mx-auto mb-2" />
              <p className="text-primary font-bold">NIVEAU MAXIMUM ATTEINT!</p>
              <p className="text-text-muted text-sm">XP Total: {playerLevel.total_xp.toLocaleString()}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Stats Card */}
      <Card className="bg-button-bg border-wheel-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-text-primary">Statistiques</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-game-dark rounded-lg">
            <Star className="w-6 h-6 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">{playerLevel.total_xp.toLocaleString()}</div>
            <div className="text-xs text-text-muted">XP Total</div>
          </div>
          <div className="text-center p-3 bg-game-dark rounded-lg">
            <Trophy className="w-6 h-6 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">{localLeaderboardEntries.length}</div>
            <div className="text-xs text-text-muted">Tops</div>
          </div>
        </div>
      </Card>

      {/* Leaderboard Rankings */}
      <Card className="bg-button-bg border-wheel-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-text-primary">Mes Classements</h3>
        </div>

        {loading ? (
          <div className="text-center py-8 text-text-muted">Chargement...</div>
        ) : localLeaderboardEntries.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
            <p className="text-primary font-medium mb-2">Continue de jouer !</p>
            <p className="text-text-muted text-sm">
              Entre dans le top 100 global ou le top 50 hebdomadaire pour apparaître ici
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {localLeaderboardEntries.map((entry, idx) => (
              <div
                key={`${entry.mode}-${entry.type}-${idx}`}
                className="flex items-center justify-between p-3 bg-game-dark rounded-lg hover:bg-game-dark/80 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-text-primary">
                      {getModeDisplayName(entry.mode)}
                    </span>
                    <Badge variant={entry.type === 'weekly' ? 'secondary' : 'outline'} className="text-xs">
                      {entry.type === 'weekly' ? 'Hebdo' : 'Global'}
                    </Badge>
                  </div>
                  <div className="text-sm text-text-muted">
                    Score: {entry.score.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getRankBadgeVariant(entry.rank)} className="mb-1">
                    #{entry.rank}
                  </Badge>
                  <div className="text-xs text-text-muted">
                    sur {entry.total_players}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Level milestones info */}
      <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <p className="text-xs text-text-muted text-center">
          💡 Gagnez de l'XP en jouant! Chaque point de score = 1 XP
        </p>
      </div>
    </div>
  );
};
