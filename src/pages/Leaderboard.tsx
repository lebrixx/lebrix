import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Medal, Award, Crown, Target, ChevronsDown } from 'lucide-react';
import { fetchTop, Score } from '@/utils/scoresApi';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardEntry {
  username: string;
  score: number;
  created_at: string;
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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchLeaderboard = async (mode: string) => {
    setLoading(true);
    try {
      const data = await fetchTop(mode, 50);
      setLeaderboard(data.map(e => ({ username: e.username, score: e.score, created_at: e.created_at })));
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Impossible de charger le classement.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard(selectedMode);
  }, [selectedMode]);

  const handleScrollButton = () => {
    if (isAtTop) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
  }, [leaderboard]);

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
      <div ref={scrollContainerRef} className="flex-1 px-4 pb-4 overflow-y-auto relative">
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
              <Card key={`${entry.username}-${index}`} 
                    className={`p-4 bg-button-bg border-wheel-border hover:scale-[1.02] transition-all duration-300 ${
                      index < 3 ? 'shadow-glow-primary' : ''
                    }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(index + 1)}
                      <Badge variant={getRankBadgeVariant(index + 1)} className="font-bold">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary text-lg">
                        {entry.username}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="font-bold text-primary text-xl">{entry.score}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Scroll Button */}
      {showScrollButton && (
        <Button
          onClick={handleScrollButton}
          size="icon"
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-button-bg/40 border border-wheel-border/50 hover:bg-button-bg/60 shadow-lg backdrop-blur-sm transition-all hover:scale-110 z-50"
          aria-label={isAtTop ? 'Aller en bas' : 'Revenir en haut'}
        >
          <ChevronsDown className={`w-4 h-4 text-primary/70 transition-transform ${isAtTop ? '' : 'rotate-180'}`} />
        </Button>
      )}
    </div>
  );
};