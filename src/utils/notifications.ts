// Service de notifications push
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const NOTIFICATION_MESSAGES = [
  "🎮 Prêt à battre ton score aujourd'hui ?",
  "⚡ C'est l'heure de tester tes réflexes !",
  "🔥 N'oublie pas ta partie quotidienne !",
  "💎 Des coins gratuits t'attendent dans le jeu !",
  "🌟 Tes adversaires progressent... et toi ?",
  "🚀 Prêt pour un nouveau défi ?",
];

export async function requestNotificationPermission(): Promise<boolean> {
  // Si on est sur mobile natif, utiliser les notifications locales Capacitor
  if (Capacitor.isNativePlatform()) {
    const permission = await LocalNotifications.requestPermissions();
    return permission.display === 'granted';
  }

  // Sinon utiliser les notifications web
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

  // Sur mobile natif, utiliser les notifications locales Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Lucky Stop',
            body: message,
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 1000) }, // Dans 1 seconde
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (error) {
      console.error('Erreur notification native:', error);
    }
    return;
  }

  // Sur web, utiliser l'API Notification standard
  try {
    new Notification('Lucky Stop', {
      body: message,
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      tag: 'daily-reminder',
    });
  } catch (error) {
    console.error('Erreur notification:', error);
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