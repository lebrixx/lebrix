// Service de notifications push
import { Capacitor } from '@capacitor/core';

const NOTIFICATION_MESSAGES = [
  "🎮 Prêt à battre ton record aujourd'hui ?",
  "🏆 Ta zone verte t'attend ! Viens jouer !",
  "⚡ C'est l'heure de tester tes réflexes !",
  "🎯 Ton meilleur score t'attend !",
  "🔥 N'oublie pas ta partie quotidienne !",
  "💎 Des coins gratuits t'attendent dans le jeu !",
  "🌟 Tes adversaires progressent... et toi ?",
  "🚀 Prêt pour un nouveau défi ?",
];

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Les notifications ne sont pas supportées');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function scheduleDailyNotification() {
  // Vérifier que les notifications sont activées
  const enabled = localStorage.getItem('notificationsEnabled') === 'true';
  if (!enabled) return;

  // Annuler les notifications précédentes
  cancelScheduledNotification();

  // Calculer le prochain moment entre 10h et 20h
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Heure aléatoire entre 10h et 20h (en millisecondes)
  const minHour = 10 * 60 * 60 * 1000; // 10h
  const maxHour = 20 * 60 * 60 * 1000; // 20h
  const randomTime = Math.random() * (maxHour - minHour) + minHour;
  
  const nextNotification = new Date(today.getTime() + randomTime);
  
  // Si l'heure est déjà passée aujourd'hui, programmer pour demain
  if (nextNotification <= now) {
    nextNotification.setDate(nextNotification.getDate() + 1);
  }

  const delay = nextNotification.getTime() - now.getTime();
  
  const timeoutId = setTimeout(() => {
    showNotification();
    // Reprogrammer pour le lendemain
    scheduleDailyNotification();
  }, delay);

  // Sauvegarder l'ID du timeout pour pouvoir l'annuler
  localStorage.setItem('notificationTimeoutId', String(timeoutId));
  
  console.log('Prochaine notification programmée pour:', nextNotification.toLocaleString());
}

export function cancelScheduledNotification() {
  const timeoutId = localStorage.getItem('notificationTimeoutId');
  if (timeoutId) {
    clearTimeout(Number(timeoutId));
    localStorage.removeItem('notificationTimeoutId');
  }
}

async function showNotification() {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const message = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];

  // Sur les appareils natifs (Capacitor), utiliser l'API native si disponible
  if (Capacitor.isNativePlatform()) {
    // TODO: Implémenter avec @capacitor/local-notifications si nécessaire
    console.log('Notification native:', message);
  } else {
    // Navigateur web
    new Notification('Lucky Stop', {
      body: message,
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      tag: 'daily-reminder',
    });
  }
}

// Initialiser les notifications au chargement
export function initNotifications() {
  const enabled = localStorage.getItem('notificationsEnabled') === 'true';
  if (enabled) {
    requestNotificationPermission().then(granted => {
      if (granted) {
        scheduleDailyNotification();
      }
    });
  }
}