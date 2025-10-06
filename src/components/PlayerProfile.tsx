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

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ onBack }) => {
  const { profile, isAuthenticated } = useAuth();
  const { playerLevel, calculateXpForLevel } = usePlayerLevel();
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');

  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);

      // Get username from profile or localStorage
      if (isAuthenticated && profile?.username) {
        setUsername(profile.username);
      } else {
        const localIdentity = getLocalIdentity();
        setUsername(localIdentity.username || 'Joueur');
      }

      // Fetch leaderboard rankings only if authenticated
      if (isAuthenticated && profile?.id) {
        const { data: leaderboardData } = await supabase
          .from('leaderboard')
          .select('mode, score')
          .eq('user_id', profile.id);

        if (leaderboardData) {
          // For each mode, get player's rank by counting higher scores
          const entriesPromises = leaderboardData.map(async (entry) => {
            const { count: higherScoresCount } = await supabase
              .from('leaderboard')
              .select('*', { count: 'exact', head: true })
              .eq('mode', entry.mode)
              .gt('score', entry.score);

            const rank = (higherScoresCount || 0) + 1;

            const { count } = await supabase
              .from('leaderboard')
              .select('*', { count: 'exact', head: true })
              .eq('mode', entry.mode);

            return {
              mode: entry.mode,
              rank: rank,
              score: entry.score,
              total_players: count || 0
            };
          });

          const entries = await Promise.all(entriesPromises);
          setLeaderboardEntries(entries.filter(e => e.rank > 0));
        }
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
            <div className="text-2xl font-bold text-primary">{isAuthenticated ? leaderboardEntries.length : '-'}</div>
            <div className="text-xs text-text-muted">Classements</div>
          </div>
        </div>
      </Card>

      {/* Leaderboard Rankings */}
      {isAuthenticated && (
        <Card className="bg-button-bg border-wheel-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-text-primary">Classements</h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-text-muted">Chargement...</div>
          ) : leaderboardEntries.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              Aucun classement pour le moment. Jouez pour apparaître dans le top!
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboardEntries.map((entry) => (
                <div
                  key={entry.mode}
                  className="flex items-center justify-between p-3 bg-game-dark rounded-lg hover:bg-game-dark/80 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-bold text-text-primary mb-1">
                      {getModeDisplayName(entry.mode)}
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
      )}

      {/* Login prompt for non-authenticated users */}
      {!isAuthenticated && (
        <Card className="bg-button-bg border-wheel-border p-6">
          <div className="text-center">
            <Crown className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold text-primary mb-2">Débloquer plus de fonctionnalités</h3>
            <p className="text-sm text-text-muted mb-4">
              Créez un compte pour sauvegarder votre progression, apparaître dans les classements mondiaux et synchroniser vos données sur tous vos appareils !
            </p>
            <Button
              onClick={() => window.location.href = '/auth'}
              className="bg-gradient-primary hover:scale-105 transition-all w-full"
            >
              Se connecter / S'inscrire
            </Button>
          </div>
        </Card>
      )}

      {/* Level milestones info */}
      <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <p className="text-xs text-text-muted text-center">
          💡 Gagnez de l'XP en jouant! Chaque point de score = 1 XP
        </p>
      </div>
    </div>
  );
};
