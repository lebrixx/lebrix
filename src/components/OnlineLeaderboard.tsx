import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trophy, Medal, Award, Crown, RefreshCw, Wifi, WifiOff, User, Edit, Calendar, Globe, ChevronsDown, History, X } from 'lucide-react';
import { fetchTop, fetchWeeklyTop, fetchPreviousWeekTop, Score } from '@/utils/scoresApi';
import { useToast } from '@/hooks/use-toast';
import { getLocalIdentity } from '@/utils/localIdentity';
import { UsernameModal } from '@/components/UsernameModal';
import { WeeklyTimer } from '@/components/WeeklyTimer';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { getPreviousWeekStartDate, getPreviousWeekEndDate } from '@/utils/weeklyUtils';

interface OnlineLeaderboardProps {
  onBack: () => void;
}

const modeNames = {
  classic: 'Classique',
  arc_changeant: 'Arc Changeant',
  survie_60s: 'Survie 30s',
  zone_mobile: 'Zone Mobile',
  zone_traitresse: 'Zone Traîtresse',
  memoire_expert: 'Mémoire (Expert)'
};

export const OnlineLeaderboard: React.FC<OnlineLeaderboardProps> = ({ onBack }) => {
  const { language } = useLanguage();
  const t = translations[language];
  
  const [selectedMode, setSelectedMode] = useState<string>('classic');
  const [selectedTab, setSelectedTab] = useState<string>('global');
  const [scores, setScores] = useState<Score[]>([]);
  const [weeklyScores, setWeeklyScores] = useState<Score[]>([]);
  const [previousWeekScores, setPreviousWeekScores] = useState<Score[]>([]);
  const [showPreviousWeek, setShowPreviousWeek] = useState(false);
  const [loadingPreviousWeek, setLoadingPreviousWeek] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load current username on mount
  useEffect(() => {
    const identity = getLocalIdentity();
    setCurrentUsername(identity.username || t.noUsername);
  }, [t.noUsername]);

  const handleUsernameChange = () => {
    const identity = getLocalIdentity();
    setCurrentUsername(identity.username || t.noUsername);
    setShowUsernameModal(false);
    // Recharger le classement pour voir les nouveaux scores
    loadScores(selectedMode);
    toast({
      title: t.usernameChanged,
      description: t.usernameChangedDesc,
      duration: 2000
    });
  };

  const loadScores = async (mode: string) => {
    setLoading(true);
    try {
      const [globalData, weeklyData] = await Promise.all([
        fetchTop(mode),
        fetchWeeklyTop(mode)
      ]);
      setScores(globalData);
      setWeeklyScores(weeklyData);
    } catch (error) {
      toast({
        title: t.networkError,
        description: t.networkErrorDesc,
        variant: "destructive",
        duration: 3000
      });
      setScores([]);
      setWeeklyScores([]);
    }
    setLoading(false);
  };

  const loadPreviousWeekScores = async (mode: string) => {
    setLoadingPreviousWeek(true);
    try {
      const data = await fetchPreviousWeekTop(mode, 50);
      setPreviousWeekScores(data);
      setShowPreviousWeek(true);
    } catch (error) {
      toast({
        title: t.networkError,
        description: t.networkErrorDesc,
        variant: "destructive",
        duration: 3000
      });
      setPreviousWeekScores([]);
    }
    setLoadingPreviousWeek(false);
  };

  const formatPreviousWeekDates = () => {
    const start = getPreviousWeekStartDate();
    const end = getPreviousWeekEndDate();
    return `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
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
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleScrollButton = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
      
      if (isAtBottom) {
        // Si on est en bas, remonter en haut
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Sinon, descendre en bas
        scrollContainerRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isBottom = scrollHeight - scrollTop <= clientHeight + 50;
        const canScroll = scrollHeight > clientHeight;
        
        setIsAtTop(scrollTop < 50);
        // Afficher le bouton uniquement si on peut scroller
        setShowScrollButton(canScroll);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Check initial state
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [scores, weeklyScores]);

  return (
    <div className="min-h-screen bg-gradient-game theme-neon flex flex-col">
      {/* Header */}
      <div className="pt-12 px-4 pb-0">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="mb-4 border-wheel-border hover:bg-button-hover"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.back}
        </Button>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t.onlineLeaderboard.toUpperCase()}
            </h1>
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
          </div>
          
          {/* Current Username - Plus discret */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-text-secondary text-sm">{t.username}: </span>
            <span className="text-text-primary font-medium">{currentUsername}</span>
            <Button
              onClick={() => setShowUsernameModal(true)}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-text-muted hover:text-text-primary hover:bg-button-hover"
            >
              <Edit className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Onglets Classement */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-2 bg-button-bg border border-wheel-border">
            <TabsTrigger 
              value="global" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-text-primary"
            >
              <Globe className="w-4 h-4" />
              {t.global}
            </TabsTrigger>
            <TabsTrigger 
              value="weekly"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-text-primary"
            >
              <Calendar className="w-4 h-4" />
              {t.weekly}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Timer hebdomadaire */}
        {selectedTab === 'weekly' && (
          <div className="flex justify-center mb-4">
            <WeeklyTimer />
          </div>
        )}

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

        {/* Refresh Button + Previous Week Button */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <Button
            onClick={() => loadScores(selectedMode)}
            variant="outline"
            size="sm"
            disabled={loading || !isOnline}
            className="border-wheel-border hover:bg-button-hover"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </Button>
          
          {selectedTab === 'weekly' && (
            <Button
              onClick={() => loadPreviousWeekScores(selectedMode)}
              variant="outline"
              size="sm"
              disabled={loadingPreviousWeek || !isOnline}
              className="border-wheel-border hover:bg-button-hover flex items-center gap-2"
            >
              <History className={`w-4 h-4 ${loadingPreviousWeek ? 'animate-spin' : ''}`} />
              {language === 'fr' ? 'Top 50 semaine précédente' : 'Previous week Top 50'}
            </Button>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div ref={scrollContainerRef} className="flex-1 px-4 pb-4 overflow-y-auto relative">
        {!isOnline && (
          <Card className="p-4 mb-4 bg-button-bg border-wheel-border border-red-400/30">
            <div className="flex items-center gap-2 text-red-400">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">{t.offlineMode}</span>
            </div>
          </Card>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsContent value="global" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : scores.length === 0 ? (
              <Card className="p-8 text-center bg-button-bg border-wheel-border">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
                <p className="text-text-muted">{t.noScores}</p>
                <p className="text-text-muted text-sm">{t.beFirst}</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {scores.map((entry, index) => (
                  <Card key={`global-${entry.username}-${entry.score}-${index}`} 
                        className={`p-4 bg-button-bg hover:scale-[1.02] transition-all duration-300 ${
                          index === 0 ? 'border-2 border-yellow-500/50 bg-yellow-500/5' : 
                          index === 1 ? 'border-2 border-gray-400/50 bg-gray-400/5' : 
                          index === 2 ? 'border-2 border-amber-600/50 bg-amber-600/5' : 
                          'border-wheel-border'
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
                            {entry.username.length > 12 ? `${entry.username.substring(0, 12)}...` : entry.username}
                          </h3>
                          <p className="text-text-muted text-sm">
                            {formatDate(entry.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary text-xl">{entry.score}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="weekly" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
              </div>
            ) : weeklyScores.length === 0 ? (
              <Card className="p-8 text-center bg-button-bg border-wheel-border">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
                <p className="text-text-muted">{t.noWeeklyScores}</p>
                <p className="text-text-muted text-sm">{t.beFirstWeek}</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {weeklyScores.map((entry, index) => (
                  <Card key={`weekly-${entry.username}-${entry.score}-${index}`} 
                        className={`p-4 bg-button-bg hover:scale-[1.02] transition-all duration-300 ${
                          index === 0 ? 'border-2 border-yellow-500/50 bg-yellow-500/5' : 
                          index === 1 ? 'border-2 border-gray-400/50 bg-gray-400/5' : 
                          index === 2 ? 'border-2 border-amber-600/50 bg-amber-600/5' : 
                          'border-wheel-border'
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
                            {entry.username.length > 12 ? `${entry.username.substring(0, 12)}...` : entry.username}
                          </h3>
                          <p className="text-text-muted text-sm">
                            {formatDate(entry.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-secondary text-xl">{entry.score}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>

      {/* Scroll Button - Visible when scrollable */}
      {showScrollButton && (
        <Button
          onClick={handleScrollButton}
          size="icon"
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-button-bg/40 border border-wheel-border/50 hover:bg-button-bg/60 shadow-lg backdrop-blur-sm transition-all hover:scale-110 z-50"
          aria-label={isAtTop ? 'Aller en bas du classement' : 'Revenir en haut du classement'}
        >
          <ChevronsDown className={`w-4 h-4 text-primary/70 transition-transform ${isAtTop ? '' : 'rotate-180'}`} />
        </Button>
      )}
      
      {/* Username Modal */}
      <UsernameModal 
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onUsernameSet={handleUsernameChange}
      />

      {/* Previous Week Modal */}
      {showPreviousWeek && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-button-bg border-wheel-border p-6 relative">
            <Button
              onClick={() => setShowPreviousWeek(false)}
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 hover:bg-button-hover"
            >
              <X className="w-5 h-5" />
            </Button>
            
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-text-primary flex items-center justify-center gap-2">
                <History className="w-5 h-5 text-secondary" />
                {language === 'fr' ? 'Semaine précédente' : 'Previous Week'}
              </h2>
              <p className="text-text-muted text-sm mt-1">{formatPreviousWeekDates()}</p>
              <Badge variant="outline" className="mt-2">{modeNames[selectedMode as keyof typeof modeNames]}</Badge>
            </div>

            {previousWeekScores.length === 0 ? (
              <div className="text-center py-6">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
                <p className="text-text-muted">
                  {language === 'fr' ? 'Aucun score la semaine dernière' : 'No scores last week'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {previousWeekScores.map((entry, index) => (
                  <Card key={`prev-${entry.username}-${entry.score}-${index}`} 
                        className={`p-3 bg-background/50 border-wheel-border/50 ${
                          index < 3 ? 'shadow-glow-primary' : ''
                        }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getRankIcon(index + 1)}
                          <Badge variant={getRankBadgeVariant(index + 1)} className="font-bold text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                        <span className="font-medium text-text-primary">
                          {entry.username.length > 10 ? `${entry.username.substring(0, 10)}...` : entry.username}
                        </span>
                      </div>
                      <span className="font-bold text-secondary">{entry.score}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};