import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'fr' | 'en' | 'es';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'fr',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'lucky-stop-language',
    }
  )
);

export const translations = {
  fr: {
    title: 'LUCKY STOP',
    subtitle: 'Tapez dans la zone verte au bon moment!',
    bestScore: 'Meilleur Score',
    coins: 'Coins',
    playNow: 'JOUER MAINTENANT',
    gameModes: 'MODES DE JEU',
    shop: 'BOUTIQUE',
    dailyChallenges: 'DÉFIS QUOTIDIENS',
    onlineLeaderboard: 'CLASSEMENT EN LIGNE',
    theme: 'Thème',
    mode: 'Mode',
    trapWarning: '⚠️ Attention : une des zones est un piège. Choisis bien…',
    avoidTrap: 'Évite la zone piégée !',
    trapZone: 'Zone traîtresse !',
    gifts: 'Cadeaux',
    language: 'Langue',
    new: 'Nouveau',
    comingSoon: 'Coming Soon',
    comingSoonDesc: 'De nouvelles fonctionnalités arrivent bientôt ! 🚀',
  },
  en: {
    title: 'LUCKY STOP',
    subtitle: 'Tap in the green zone at the right time!',
    bestScore: 'Best Score',
    coins: 'Coins',
    playNow: 'PLAY NOW',
    gameModes: 'GAME MODES',
    shop: 'SHOP',
    dailyChallenges: 'DAILY CHALLENGES',
    onlineLeaderboard: 'ONLINE LEADERBOARD',
    theme: 'Theme',
    mode: 'Mode',
    trapWarning: '⚠️ Warning: one of the zones is a trap. Choose wisely…',
    avoidTrap: 'Avoid the trap zone!',
    trapZone: 'Trap zone!',
    gifts: 'Gifts',
    language: 'Language',
    new: 'New',
    comingSoon: 'Coming Soon',
    comingSoonDesc: 'New features coming soon! 🚀',
  },
  es: {
    title: 'LUCKY STOP',
    subtitle: '¡Toca en la zona verde en el momento justo!',
    bestScore: 'Mejor Puntuación',
    coins: 'Monedas',
    playNow: 'JUGAR AHORA',
    gameModes: 'MODOS DE JUEGO',
    shop: 'TIENDA',
    dailyChallenges: 'DESAFÍOS DIARIOS',
    onlineLeaderboard: 'CLASIFICACIÓN EN LÍNEA',
    theme: 'Tema',
    mode: 'Modo',
    trapWarning: '⚠️ Advertencia: una de las zonas es una trampa. Elige bien…',
    avoidTrap: '¡Evita la zona trampa!',
    trapZone: '¡Zona trampa!',
    gifts: 'Regalos',
    language: 'Idioma',
    new: 'Nuevo',
    comingSoon: 'Próximamente',
    comingSoonDesc: '¡Nuevas funciones próximamente! 🚀',
  },
};
