import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { StatusBar } from '@capacitor/status-bar';

// Configuration pour iOS - éviter le chevauchement avec la barre de statut
StatusBar.setOverlaysWebView({ overlay: false });

createRoot(document.getElementById("root")!).render(<App />);
