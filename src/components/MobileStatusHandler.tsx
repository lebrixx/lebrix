import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

export const MobileStatusHandler: React.FC = () => {
  useEffect(() => {
    const initializeMobileFeatures = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Configuration de la barre de statut
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
          
          // Masquer l'écran de démarrage après le chargement
          setTimeout(async () => {
            await SplashScreen.hide();
          }, 1000);
          
        } catch (error) {
          console.warn('Erreur lors de l\'initialisation des fonctionnalités mobiles:', error);
        }
      }
    };

    initializeMobileFeatures();
  }, []);

  return null; // Composant invisible
};