import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { Rewarded } from '@/ads/RewardedService';
import { Interstitials } from '@/ads/InterstitialService';

// Configuration pour iOS - safe area permanente
if (Capacitor.isNativePlatform()) {
  // Désactiver l'overlay pour que la StatusBar ne se superpose pas au contenu
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {
    // Ignore les erreurs si StatusBar n'est pas disponible
  });
  
  // Écouter les changements de visibilité de l'app pour restaurer la config
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    }
  });
  
  // Écouter le retour en premier plan (iOS)
  window.addEventListener('focus', () => {
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
  });
}

// Initialize AdMob services early
Rewarded.init();
Interstitials.init();

createRoot(document.getElementById("root")!).render(<App />);
