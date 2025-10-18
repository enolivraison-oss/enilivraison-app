import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { registerSW } from 'virtual:pwa-register';

// 🧭 Forcer la mise à jour automatique du site pour tous les utilisateurs
const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(true); // Recharge automatiquement quand une nouvelle version est dispo
  },
  onOfflineReady() {
    console.log("✅ Application prête à fonctionner hors ligne");
  },
});

const APP_VERSION = "2.1.0";
console.log("🚀 Version actuelle :", APP_VERSION);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);