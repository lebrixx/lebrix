// Les tests vérifient les textes français d'origine : on fixe la langue du jeu.
import { useLanguage } from '@/hooks/useLanguage';

useLanguage.getState().setLanguage('fr');
