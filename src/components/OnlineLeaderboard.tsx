import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Medal, Award, Crown, RefreshCw, Wifi, WifiOff, User, Edit } from 'lucide-react';
import { fetchTop, Score } from '@/utils/scoresApi';
import { useToast } from '@/hooks/use-toast';
import { getLocalIdentity, setUsername, generateDefaultUsername } from '@/utils/localIdentity';
import { UsernameModal } from '@/components/UsernameModal';

interface OnlineLeaderboardProps {
  onBack: () => void;
}

const modeNames = {
  classic: 'Classique',
  arc_changeant: 'Arc Changeant',
  survie_60s: 'Survie 60s',
  zone_mobile: 'Zone Mobile'
};

export const OnlineLeaderboard: React.FC<OnlineLeaderboardProps> = ({ onBack }) => {
  const [selectedMode, setSelectedMode] = useState<string>('classic');
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const { toast } = useToast();

  // Load current username on mount
  useEffect(() => {
    const identity = getLocalIdentity();
    setCurrentUsername(identity.username || 'Aucun pseudo');
  }, []);

  const handleUsernameChange = () => {
    const identity = getLocalIdentity();
    setCurrentUsername(identity.username || 'Aucun pseudo');
    setShowUsernameModal(false);
    toast({
      title: "Pseudo modifié",
      description: "Votre nouveau pseudo a été sauvegardé",
      duration: 2000
    });
  };

  const loadScores = async (mode: string) => {
    setLoading(true);
    try {
      const data = await fetchTop(mode);
      setScores(data);
      if (data.length === 0 && isOnline) {
        toast({
          title: "Aucun score",
          description: "Sois le premier à jouer dans ce mode !",
          duration: 2000
        });
      }
    } catch (error) {
      toast({
        title: "Erreur réseau",
        description: "Impossible de charger le classement",
        variant: "destructive",
        duration: 3000
      });
      setScores([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadScores(selectedMode);
  }, [selectedMode]);

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        loadScores(selectedMode);
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [selectedMode]);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <Trophy className="w-4 h-4 text-primary" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-game theme-neon flex flex-col">
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
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              CLASSEMENT EN LIGNE
            </h1>
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
          </div>
          <p className="text-text-secondary mb-4">
            Top 100 des meilleurs scores
          </p>
          
          {/* Current Username Display */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-button-bg border border-wheel-border rounded-lg">
              <User className="w-4 h-4 text-primary" />
              <span className="text-text-primary font-medium">{currentUsername}</span>
            </div>
            <Button
              onClick={() => setShowUsernameModal(true)}
              variant="outline"
              size="sm"
              className="border-wheel-border hover:bg-button-hover"
            >
              <Edit className="w-4 h-4 mr-1" />
              Changer
            </Button>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
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

        {/* Refresh Button */}
        <div className="flex justify-center mb-4">
          <Button
            onClick={() => loadScores(selectedMode)}
            variant="outline"
            size="sm"
            disabled={loading || !isOnline}
            className="border-wheel-border hover:bg-button-hover"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="flex-1 px-4 pb-4">
        {!isOnline && (
          <Card className="p-4 mb-4 bg-button-bg border-wheel-border border-red-400/30">
            <div className="flex items-center gap-2 text-red-400">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">Mode hors ligne - Reconnectez-vous pour voir le classement</span>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : scores.length === 0 ? (
          <Card className="p-8 text-center bg-button-bg border-wheel-border">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
            <p className="text-text-muted">Aucun score enregistré pour ce mode</p>
            <p className="text-text-muted text-sm">Sois le premier à jouer !</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {scores.map((entry, index) => (
              <Card key={`${entry.username}-${entry.score}-${index}`} 
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
                      <h3 className="font-bold text-text-primary text-lg">
                        {entry.username.length > 12 ? `${entry.username.substring(0, 12)}...` : entry.username}
                      </h3>
                      <p className="text-text-muted text-sm">
                        {formatDate(entry.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="font-bold text-primary text-xl">{entry.score}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Username Modal */}
      <UsernameModal 
        isOpen={showUsernameModal}
        onUsernameSet={handleUsernameChange}
      />
    </div>
  );
};