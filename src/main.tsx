import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { Rewarded } from '@/ads/RewardedService';
import { Interstitials } from '@/ads/InterstitialService';
import { initNotifications } from '@/utils/notifications';

// Configuration pour iOS - seulement sur les plateformes mobiles
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {
    // Ignore les erreurs si StatusBar n'est pas disponible
  });
}

// Initialize AdMob services early
Rewarded.init();
Interstitials.init();

// Initialize notifications on app start
initNotifications();

createRoot(document.getElementById("root")!).render(<App />);
