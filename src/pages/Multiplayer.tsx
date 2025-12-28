import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Users, Swords, Trophy, Zap, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage, translations } from '@/hooks/useLanguage';

const Multiplayer = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const content = {
    fr: {
      title: 'MULTIJOUEUR',
      comingSoon: 'Bientôt disponible !',
      description: 'Prépare-toi à affronter des joueurs du monde entier en temps réel !',
      features: [
        {
          icon: Swords,
          title: 'Duels 1v1',
          description: 'Affronte un adversaire en temps réel dans des duels intenses'
        },
        {
          icon: Users,
          title: 'Matchmaking',
          description: 'Trouve automatiquement des adversaires de ton niveau'
        },
        {
          icon: Trophy,
          title: 'Classement Elo',
          description: 'Grimpe les divisions et deviens le meilleur joueur'
        },
        {
          icon: Zap,
          title: 'Modes variés',
          description: 'Course au score, Best of 5, Sudden Death et plus encore'
        }
      ],
      stayTuned: 'Reste connecté sur nos réseaux sociaux pour être informé du lancement !',
      back: 'Retour'
    },
    en: {
      title: 'MULTIPLAYER',
      comingSoon: 'Coming Soon!',
      description: 'Get ready to face players from around the world in real-time!',
      features: [
        {
          icon: Swords,
          title: '1v1 Duels',
          description: 'Face an opponent in real-time in intense duels'
        },
        {
          icon: Users,
          title: 'Matchmaking',
          description: 'Automatically find opponents at your skill level'
        },
        {
          icon: Trophy,
          title: 'Elo Ranking',
          description: 'Climb the divisions and become the best player'
        },
        {
          icon: Zap,
          title: 'Various Modes',
          description: 'Score race, Best of 5, Sudden Death and more'
        }
      ],
      stayTuned: 'Stay connected on our social media to be informed of the launch!',
      back: 'Back'
    },
    es: {
      title: 'MULTIJUGADOR',
      comingSoon: '¡Próximamente!',
      description: '¡Prepárate para enfrentarte a jugadores de todo el mundo en tiempo real!',
      features: [
        {
          icon: Swords,
          title: 'Duelos 1v1',
          description: 'Enfrenta a un oponente en tiempo real en duelos intensos'
        },
        {
          icon: Users,
          title: 'Emparejamiento',
          description: 'Encuentra automáticamente oponentes de tu nivel'
        },
        {
          icon: Trophy,
          title: 'Ranking Elo',
          description: 'Sube las divisiones y conviértete en el mejor jugador'
        },
        {
          icon: Zap,
          title: 'Modos variados',
          description: 'Carrera de puntos, Best of 5, Muerte súbita y más'
        }
      ],
      stayTuned: '¡Mantente conectado en nuestras redes sociales para estar informado del lanzamiento!',
      back: 'Volver'
    },
    de: {
      title: 'MEHRSPIELER',
      comingSoon: 'Demnächst verfügbar!',
      description: 'Mach dich bereit, Spieler aus der ganzen Welt in Echtzeit herauszufordern!',
      features: [
        {
          icon: Swords,
          title: '1v1 Duelle',
          description: 'Tritt gegen einen Gegner in intensiven Echtzeit-Duellen an'
        },
        {
          icon: Users,
          title: 'Matchmaking',
          description: 'Finde automatisch Gegner auf deinem Niveau'
        },
        {
          icon: Trophy,
          title: 'Elo-Ranking',
          description: 'Steige in den Divisionen auf und werde der beste Spieler'
        },
        {
          icon: Zap,
          title: 'Verschiedene Modi',
          description: 'Punkterennen, Best of 5, Sudden Death und mehr'
        }
      ],
      stayTuned: 'Bleib auf unseren sozialen Medien verbunden, um über den Start informiert zu werden!',
      back: 'Zurück'
    },
    it: {
      title: 'MULTIGIOCATORE',
      comingSoon: 'Prossimamente!',
      description: 'Preparati ad affrontare giocatori da tutto il mondo in tempo reale!',
      features: [
        {
          icon: Swords,
          title: 'Duelli 1v1',
          description: 'Affronta un avversario in tempo reale in duelli intensi'
        },
        {
          icon: Users,
          title: 'Matchmaking',
          description: 'Trova automaticamente avversari del tuo livello'
        },
        {
          icon: Trophy,
          title: 'Classifica Elo',
          description: 'Scala le divisioni e diventa il miglior giocatore'
        },
        {
          icon: Zap,
          title: 'Modalità varie',
          description: 'Corsa al punteggio, Best of 5, Sudden Death e altro'
        }
      ],
      stayTuned: 'Resta connesso sui nostri social media per essere informato sul lancio!',
      back: 'Indietro'
    },
    pt: {
      title: 'MULTIJOGADOR',
      comingSoon: 'Em breve!',
      description: 'Prepare-se para enfrentar jogadores de todo o mundo em tempo real!',
      features: [
        {
          icon: Swords,
          title: 'Duelos 1v1',
          description: 'Enfrente um oponente em tempo real em duelos intensos'
        },
        {
          icon: Users,
          title: 'Matchmaking',
          description: 'Encontre automaticamente oponentes do seu nível'
        },
        {
          icon: Trophy,
          title: 'Ranking Elo',
          description: 'Suba as divisões e torne-se o melhor jogador'
        },
        {
          icon: Zap,
          title: 'Modos variados',
          description: 'Corrida de pontos, Best of 5, Morte súbita e mais'
        }
      ],
      stayTuned: 'Fique conectado em nossas redes sociais para ser informado do lançamento!',
      back: 'Voltar'
    },
    ar: {
      title: 'متعدد اللاعبين',
      comingSoon: 'قريباً!',
      description: 'استعد لمواجهة لاعبين من جميع أنحاء العالم في الوقت الفعلي!',
      features: [
        {
          icon: Swords,
          title: 'مبارزات 1 ضد 1',
          description: 'واجه خصماً في الوقت الفعلي في مبارزات مكثفة'
        },
        {
          icon: Users,
          title: 'البحث عن خصم',
          description: 'ابحث تلقائياً عن خصوم في مستواك'
        },
        {
          icon: Trophy,
          title: 'تصنيف إيلو',
          description: 'اصعد في الأقسام وكن أفضل لاعب'
        },
        {
          icon: Zap,
          title: 'أوضاع متنوعة',
          description: 'سباق النقاط، أفضل 5، الموت المفاجئ والمزيد'
        }
      ],
      stayTuned: 'ابق على اتصال على وسائل التواصل الاجتماعي لدينا لتكون على علم بالإطلاق!',
      back: 'رجوع'
    },
    ja: {
      title: 'マルチプレイヤー',
      comingSoon: '近日公開！',
      description: '世界中のプレイヤーとリアルタイムで対戦する準備をしよう！',
      features: [
        {
          icon: Swords,
          title: '1対1デュエル',
          description: 'リアルタイムで激しいデュエルで対戦相手と戦う'
        },
        {
          icon: Users,
          title: 'マッチメイキング',
          description: '自分のレベルの対戦相手を自動的に見つける'
        },
        {
          icon: Trophy,
          title: 'Eloランキング',
          description: 'ディビジョンを上げて最高のプレイヤーになる'
        },
        {
          icon: Zap,
          title: '様々なモード',
          description: 'スコアレース、Best of 5、サドンデスなど'
        }
      ],
      stayTuned: 'ローンチ情報を得るためにSNSでフォローしてください！',
      back: '戻る'
    },
    zh: {
      title: '多人游戏',
      comingSoon: '即将推出！',
      description: '准备好与来自世界各地的玩家实时对战！',
      features: [
        {
          icon: Swords,
          title: '1对1决斗',
          description: '在激烈的实时决斗中与对手对战'
        },
        {
          icon: Users,
          title: '匹配系统',
          description: '自动找到与你水平相当的对手'
        },
        {
          icon: Trophy,
          title: 'Elo排名',
          description: '提升段位，成为最佳玩家'
        },
        {
          icon: Zap,
          title: '多种模式',
          description: '积分赛、五局三胜、突然死亡等'
        }
      ],
      stayTuned: '关注我们的社交媒体，了解发布信息！',
      back: '返回'
    }
  };

  const t = content[language] || content.en;

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col p-4 pt-safe">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Button>
        <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          {t.title}
        </h1>
      </div>

      {/* Coming Soon Banner */}
      <Card className="bg-button-bg border-wheel-border p-6 mb-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Users className="w-16 h-16 text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center animate-bounce">
              <Clock className="w-4 h-4 text-game-dark" />
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-secondary mb-2 animate-pulse">
          {t.comingSoon}
        </h2>
        <p className="text-text-secondary text-sm">
          {t.description}
        </p>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {t.features.map((feature, index) => (
          <Card 
            key={index}
            className="bg-button-bg border-wheel-border p-4 flex items-start gap-4 hover:border-primary/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary mb-1">{feature.title}</h3>
              <p className="text-sm text-text-muted">{feature.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Stay Tuned */}
      <Card className="bg-primary/10 border-primary/30 p-4 text-center">
        <p className="text-text-secondary text-sm">
          {t.stayTuned}
        </p>
      </Card>

      {/* Back Button */}
      <Button
        onClick={() => navigate('/')}
        variant="outline"
        className="mt-6 border-wheel-border hover:bg-button-hover"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t.back}
      </Button>
    </div>
  );
};

export default Multiplayer;
