// Désactive tout service worker résiduel pour forcer la prise en compte des mises à jour
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log("🧹 Service Worker désactivé");
    }
  });
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from '@capacitor/core';
import { Rewarded } from '@/ads/RewardedService';
import { Interstitials } from '@/ads/InterstitialService';
import { initNotifications } from '@/utils/notifications';
import { installNativeUiGuards, restoreNativeUi } from '@/utils/nativeUi';

// Configuration pour iOS - seulement sur les plateformes mobiles
if (Capacitor.isNativePlatform()) {
  restoreNativeUi('startup');
  installNativeUiGuards();
}

// Initialize AdMob services early
Rewarded.init();
Interstitials.init();

// Initialize notifications on app start
initNotifications();

createRoot(document.getElementById("root")!).render(<App />);
