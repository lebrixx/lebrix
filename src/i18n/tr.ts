import { useCallback } from 'react';
import { useLanguage, type Language } from '@/hooks/useLanguage';

/** Langue courante, utilisable hors composant React (moteurs de jeu, notifications…). */
export const currentLang = (): Language => useLanguage.getState().language;

const pick = (lang: Language, fr: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : fr);

/** Traduction directe hors React : trs('Jouer', 'Play', 'Jugar'). */
export function trs(fr: string, en: string, es: string): string {
  return pick(currentLang(), fr, en, es);
}

/** Version hook (se met à jour quand la langue change). */
export function useTr() {
  const { language } = useLanguage();
  return useCallback((fr: string, en: string, es: string) => pick(language, fr, en, es), [language]);
}
