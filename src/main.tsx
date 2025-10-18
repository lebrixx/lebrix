import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { Ads } from '@/ads/AdService';

// Configuration pour iOS - seulement sur les plateformes mobiles
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {
    // Ignore les erreurs si StatusBar n'est pas disponible
  });
}

// Initialize AdMob early
Ads.init();

createRoot(document.getElementById("root")!).render(<App />);
