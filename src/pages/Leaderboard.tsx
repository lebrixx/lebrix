import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Medal, Award, Crown, Target, Coins, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  mode: string;
  score: number;
  coins: number;
  games_played: number;
  max_speed_reached: number;
  direction_changes: number;
  created_at: string;
  level?: number;
}

interface LeaderboardProps {
  onBack: () => void;
}

const modeNames = {
  classic: 'Classique',
  arc_changeant: 'Arc Changeant',
  survie_60s: 'Survie 60s',
  zone_mobile: 'Zone Mobile',
  zone_traitresse: 'Zone Traîtresse'
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [selectedMode, setSelectedMode] = useState<string>('classic');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeaderboard = async (mode: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          *,
          profiles(username)
        `)
        .eq('mode', mode)
        .order('score', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch levels separately
      const userIds = data?.map(entry => entry.user_id) || [];
      const { data: levelsData } = await supabase
        .from('player_levels')
        .select('user_id, level')
        .in('user_id', userIds);

      const levelsMap = new Map(levelsData?.map(l => [l.user_id, l.level]) || []);

      const formattedData = data?.map(entry => ({
        ...entry,
        username: entry.profiles?.username || 'Anonyme',
        level: levelsMap.get(entry.user_id) || 1
      })) || [];

      setLeaderboard(formattedData);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger le classement",
        variant: "destructive"
      });
      console.error('Error fetching leaderboard:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard(selectedMode);
  }, [selectedMode]);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <Trophy className="w-5 h-5 text-primary" />;
    }
  };

  const getRankBadgeVariant = (position: number) => {
    switch (position) {
      case 1: return "default";
      case 2: return "secondary"; 
      case 3: return "outline";
      default: return "outline";
    }
  };

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

        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            CLASSEMENT
          </h1>
          <p className="text-text-secondary">
            Comparez vos performances avec les autres joueurs
          </p>
        </div>

        {/* Mode Selection */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {Object.entries(modeNames).map(([mode, name]) => (
            <Button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              variant={selectedMode === mode ? "default" : "outline"}
              size="sm"
              className={selectedMode === mode ? 
                "bg-gradient-primary" : 
                "border-wheel-border hover:bg-button-hover"
              }
            >
              {name}
            </Button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="flex-1 px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="p-8 text-center bg-button-bg border-wheel-border">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
            <p className="text-text-muted">Aucun score enregistré pour ce mode</p>
            <p className="text-text-muted text-sm">Soyez le premier à jouer !</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <Card key={entry.id} 
                    className={`p-4 bg-button-bg border-wheel-border hover:scale-[1.02] transition-all duration-300 ${
                      index < 3 ? 'shadow-glow-primary' : ''
                    }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex items-center gap-2">
                      {getRankIcon(index + 1)}
                      <Badge variant={getRankBadgeVariant(index + 1)} className="font-bold">
                        #{index + 1}
                      </Badge>
                    </div>

                    {/* Username */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-text-primary text-lg">
                          {entry.username}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          Niv. {entry.level}
                        </Badge>
                      </div>
                      <p className="text-text-muted text-sm">
                        {entry.games_played} partie{entry.games_played > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-right">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="font-bold text-primary text-xl">{entry.score}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-secondary" />
                      <span className="text-secondary font-medium">{entry.coins}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" />
                      <span className="text-accent text-sm">
                        {entry.max_speed_reached.toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional stats for top 3 */}
                {index < 3 && (
                  <div className="mt-3 pt-3 border-t border-wheel-border/30">
                    <div className="flex justify-between text-sm text-text-muted">
                      <span>Vitesse max: {entry.max_speed_reached.toFixed(2)}</span>
                      <span>Changements de direction: {entry.direction_changes}</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};