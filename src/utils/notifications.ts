// Service de notifications push
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { canSpinFree, getWheelState } from '@/utils/luckyWheel';

const NOTIFICATION_MESSAGES = [
  "🎮 Prêt à battre ton score aujourd'hui ?",
  "⚡ C'est l'heure de tester tes réflexes !",
  "🔥 N'oublie pas ta partie quotidienne !",
  "💎 Des coins gratuits t'attendent dans le jeu !",
  "🌟 Tes adversaires progressent... et toi ?",
  "🚀 Prêt pour un nouveau défi ?",
];

const WHEEL_NOTIFICATION_ID = 2000;

export async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (Capacitor.isNativePlatform()) {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display === 'granted') return 'granted';
    if (permission.display === 'denied') return 'denied';
    return 'prompt';
  }

  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return 'prompt';
}

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

export async function scheduleDailyNotification() {
  // Vérifier que les notifications sont activées
  const enabled = localStorage.getItem('notificationsEnabled') === 'true';
  if (!enabled) return;

  // Annuler les notifications précédentes
  await cancelScheduledNotification();

  // Sur mobile natif, utiliser le scheduling natif
  if (Capacitor.isNativePlatform()) {
    try {
      const now = new Date();
      const daysToSchedule = 14; // Programmer 14 jours à l'avance (limite iOS = 64)
      const notifications = [] as any[];

      for (let i = 0; i < daysToSchedule; i++) {
        const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        const randomHour = Math.floor(Math.random() * (20 - 10 + 1)) + 10; // 10h-20h
        const randomMinute = Math.floor(Math.random() * 60);
        const at = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), randomHour, randomMinute);

        // Ne pas programmer dans le passé pour aujourd'hui
        if (i === 0 && at <= now) {
          at.setDate(at.getDate() + 1);
        }

        notifications.push({
          title: 'Lucky Stop',
          body: NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)],
          id: 1001 + i, // Réservons une plage d'IDs
          schedule: { 
            at,
            allowWhileIdle: true
          },
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
          extra: null
        });
      }

      await LocalNotifications.schedule({ notifications });
      console.log('Notifications natives programmées:', notifications.map(n => n.schedule?.at?.toString()));
    } catch (error) {
      console.error('Erreur scheduling notification native:', error);
    }
    return;
  }

  // Sur web, utiliser setTimeout (fonctionne seulement si l'app reste ouverte)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const minHour = 10 * 60 * 60 * 1000;
  const maxHour = 20 * 60 * 60 * 1000;
  const randomTime = Math.random() * (maxHour - minHour) + minHour;
  
  const nextNotification = new Date(today.getTime() + randomTime);
  
  if (nextNotification <= now) {
    nextNotification.setDate(nextNotification.getDate() + 1);
  }

  const delay = nextNotification.getTime() - now.getTime();
  
  const timeoutId = setTimeout(() => {
    showNotification();
    scheduleDailyNotification();
  }, delay);

  localStorage.setItem('notificationTimeoutId', String(timeoutId));
  console.log('Notification web programmée pour:', nextNotification.toLocaleString());
}

export async function cancelScheduledNotification() {
  // Annuler les notifications natives
  if (Capacitor.isNativePlatform()) {
    try {
      const range = 20; // Annuler jusqu'à 20 notifs planifiées
      const ids = Array.from({ length: range }, (_, i) => ({ id: 1001 + i }))
        .concat([{ id: 1 }, { id: 2 }]);
      await LocalNotifications.cancel({ notifications: ids });
    } catch (error) {
      console.error('Erreur annulation notification native:', error);
    }
  }

  // Annuler les timeouts web
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
            id: 2, // ID différent du scheduling quotidien
            schedule: { 
              at: new Date(Date.now() + 1000),
              allowWhileIdle: true
            },
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

// Fonction pour tester les notifications
export async function sendTestNotification(): Promise<boolean> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return false;

  const testMessage = "🔔 Test réussi ! Les notifications fonctionnent.";

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Lucky Stop - Test',
            body: testMessage,
            id: 999, // ID unique pour le test
            schedule: { 
              at: new Date(Date.now() + 500),
              allowWhileIdle: true
            },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
      return true;
    } catch (error) {
      console.error('Erreur test notification native:', error);
      return false;
    }
  }

  // Sur web
  try {
    new Notification('Lucky Stop - Test', {
      body: testMessage,
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      tag: 'test-notification',
    });
    return true;
  } catch (error) {
    console.error('Erreur test notification:', error);
    return false;
  }
}

// Programmer la notification de la roue pour le lendemain
export async function scheduleWheelNotification() {
  const enabled = localStorage.getItem('notificationsEnabled') === 'true';
  if (!enabled) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Calculer minuit du prochain jour
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  // Ajouter une heure aléatoire entre 8h et 12h pour la notification
  const randomHour = Math.floor(Math.random() * (12 - 8 + 1)) + 8;
  const randomMinute = Math.floor(Math.random() * 60);
  tomorrow.setHours(randomHour, randomMinute, 0, 0);

  if (Capacitor.isNativePlatform()) {
    try {
      // Annuler l'ancienne notification de roue
      await LocalNotifications.cancel({ notifications: [{ id: WHEEL_NOTIFICATION_ID }] });
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Lucky Stop 🎡',
            body: '🎡 Ta roue de la chance est prête ! Viens tourner pour gagner des récompenses !',
            id: WHEEL_NOTIFICATION_ID,
            schedule: { 
              at: tomorrow,
              allowWhileIdle: true
            },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
      console.log('Notification roue programmée pour:', tomorrow.toLocaleString());
    } catch (error) {
      console.error('Erreur scheduling notification roue:', error);
    }
  } else {
    // Sur web, programmer avec setTimeout
    const delay = tomorrow.getTime() - now.getTime();
    
    // Annuler l'ancien timeout
    const oldTimeoutId = localStorage.getItem('wheelNotificationTimeoutId');
    if (oldTimeoutId) {
      clearTimeout(Number(oldTimeoutId));
    }
    
    const timeoutId = setTimeout(async () => {
      if (canSpinFree()) {
        try {
          new Notification('Lucky Stop 🎡', {
            body: '🎡 Ta roue de la chance est prête ! Viens tourner pour gagner des récompenses !',
            icon: '/icon-512.png',
            badge: '/icon-512.png',
            tag: 'wheel-ready',
          });
        } catch (error) {
          console.error('Erreur notification roue:', error);
        }
      }
    }, delay);
    
    localStorage.setItem('wheelNotificationTimeoutId', String(timeoutId));
    console.log('Notification roue web programmée pour:', tomorrow.toLocaleString());
  }
}

// Initialiser les notifications au chargement
export function initNotifications() {
  const enabled = localStorage.getItem('notificationsEnabled') === 'true';
  if (enabled) {
    requestNotificationPermission().then(granted => {
      if (granted) {
        scheduleDailyNotification();
        // Programmer aussi la notification de la roue si elle n'est pas déjà disponible
        if (!canSpinFree()) {
          scheduleWheelNotification();
        }
      }
    });
  }
}