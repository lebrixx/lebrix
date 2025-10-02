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
  },
};
