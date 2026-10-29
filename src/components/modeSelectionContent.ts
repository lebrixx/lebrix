import { ModeID } from '@/constants/modes';
import rush from '@/assets/hub/rush.jpg';
import arena from '@/assets/hub/arena.jpg';
import assaut from '@/assets/hub/assaut.jpg';
import cube from '@/assets/hub/cube-dodge.jpg';
import ball from '@/assets/hub/ball-balance.jpg';
import stack from '@/assets/hub/stack-jump.jpg';

export const modeArtwork = {
  [ModeID.BRIX_RUSH]: rush, [ModeID.ASSAUT]: assaut,
  [ModeID.BRIX_ARENA]: arena, [ModeID.CLASSIC]: cube,
  [ModeID.ARC_CHANGEANT]: ball, [ModeID.SURVIE_60S]: stack,
};

export const hubCopy = {
  fr: {
    arcade: "L’ARCADE", eyebrow: 'À TOI DE JOUER', title: 'Choisis ton défi.', games: 'jeux',
    footer: '6 défis. Aucun compte.', back: 'Retour au menu', play: 'Jouer', record: 'Record',
    solo: 'Solo', action: 'Solo · action', soon: 'Multi · SOON', tickets: 'ticket / partie',
    available: 'disponibles', getTickets: 'Tickets', nextSpin: 'Prochain tirage dans',
    categories: ['COURSE', 'ESPACE', 'SURVIE', 'RÉFLEXES', 'ÉQUILIBRE', 'PRÉCISION'],
    taglines: ['Toujours une route de plus.', 'L’espace ne fait pas de cadeau.', 'Chaque seconde compte.', 'Une esquive d’avance.', 'Garde le cap. Garde l’équilibre.', 'Toujours plus haut.'],
  },
  en: {
    arcade: 'THE ARCADE', eyebrow: 'YOUR TURN', title: 'Choose your challenge.', games: 'games',
    footer: '6 challenges. No account.', back: 'Back to menu', play: 'Play', record: 'Best',
    solo: 'Solo', action: 'Solo · action', soon: 'Multiplayer · SOON', tickets: 'ticket / game',
    available: 'available', getTickets: 'Tickets', nextSpin: 'Next draw in',
    categories: ['RACING', 'SPACE', 'SURVIVAL', 'REFLEXES', 'BALANCE', 'PRECISION'],
    taglines: ['Always one more road.', 'Space shows no mercy.', 'Every second counts.', 'One dodge ahead.', 'Stay on track. Keep your balance.', 'Always a little higher.'],
  },
  es: {
    arcade: 'EL ARCADE', eyebrow: 'TE TOCA JUGAR', title: 'Elige tu desafío.', games: 'juegos',
    footer: '6 desafíos. Sin cuenta.', back: 'Volver al menú', play: 'Jugar', record: 'Récord',
    solo: 'Solo', action: 'Solo · acción', soon: 'Multi · SOON', tickets: 'ticket / partida',
    available: 'disponibles', getTickets: 'Tickets', nextSpin: 'Próximo sorteo en',
    categories: ['CARRERA', 'ESPACIO', 'SUPERVIVENCIA', 'REFLEJOS', 'EQUILIBRIO', 'PRECISIÓN'],
    taglines: ['Siempre una carretera más.', 'El espacio no perdona.', 'Cada segundo cuenta.', 'Una esquiva por delante.', 'Sigue el camino. Mantén el equilibrio.', 'Siempre más alto.'],
  },
};