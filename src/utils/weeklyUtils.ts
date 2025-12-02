// Utilitaires pour la gestion du classement hebdomadaire

export function getWeekStartDate(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début de semaine
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekEndDate(date: Date = new Date()): Date {
  const weekStart = getWeekStartDate(date);
  const sunday = new Date(weekStart);
  sunday.setDate(weekStart.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

export function getNextWeekStart(): Date {
  const now = new Date();
  const nextMonday = new Date();
  const daysUntilMonday = (7 - now.getDay() + 1) % 7;
  nextMonday.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

export function getTimeUntilNextWeek(): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const nextWeek = getNextWeekStart();
  const diff = nextWeek.getTime() - now.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
}

export function isCurrentWeek(date: string | Date): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const weekStart = getWeekStartDate();
  const weekEnd = getWeekEndDate();
  
  return targetDate >= weekStart && targetDate <= weekEnd;
}

export function getPreviousWeekStartDate(date: Date = new Date()): Date {
  const currentWeekStart = getWeekStartDate(date);
  const previousMonday = new Date(currentWeekStart);
  previousMonday.setDate(currentWeekStart.getDate() - 7);
  previousMonday.setHours(0, 0, 0, 0);
  return previousMonday;
}

export function getPreviousWeekEndDate(date: Date = new Date()): Date {
  const previousWeekStart = getPreviousWeekStartDate(date);
  const previousSunday = new Date(previousWeekStart);
  previousSunday.setDate(previousWeekStart.getDate() + 6);
  previousSunday.setHours(23, 59, 59, 999);
  return previousSunday;
}