// Système de gestion des tickets pour le mode expert

const TICKETS_KEY = 'expert_tickets';

export interface TicketsState {
  tickets: number;
  lastUpdated: number;
}

/**
 * Récupérer le nombre de tickets disponibles
 */
export function getTickets(): number {
  try {
    const saved = localStorage.getItem(TICKETS_KEY);
    if (!saved) return 0;
    
    const state: TicketsState = JSON.parse(saved);
    return state.tickets || 0;
  } catch (e) {
    console.error('Error reading tickets:', e);
    return 0;
  }
}

/**
 * Ajouter des tickets
 */
export function addTickets(amount: number): void {
  try {
    const current = getTickets();
    const state: TicketsState = {
      tickets: current + amount,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(TICKETS_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error adding tickets:', e);
  }
}

/**
 * Retirer un ticket (pour jouer une partie)
 * Retourne true si le ticket a été retiré, false si pas assez de tickets
 */
export function consumeTicket(): boolean {
  try {
    const current = getTickets();
    if (current <= 0) return false;
    
    const state: TicketsState = {
      tickets: current - 1,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(TICKETS_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('Error consuming ticket:', e);
    return false;
  }
}

/**
 * Définir le nombre de tickets (pour les tests ou les ajustements)
 */
export function setTickets(amount: number): void {
  try {
    const state: TicketsState = {
      tickets: Math.max(0, amount),
      lastUpdated: Date.now(),
    };
    localStorage.setItem(TICKETS_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error setting tickets:', e);
  }
}
