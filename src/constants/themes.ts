import { trs } from '@/i18n/tr';
export type ThemeDef = {
  id: string;
  name: string;
  price: number;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview: {
    background: string; // CSS gradient
    circle: string;     // Accent color (used for bar/ball)
    successZone: string; // Green/success arc color (high contrast)
  };
};

// Curated themes with strong contrast and harmonious palettes
export const THEMES: ThemeDef[] = [
  {
    id: 'theme-neon',
    get name() { return trs("Néon Électrique", "Electric Neon", "Neón Eléctrico"); },
    price: 0,
    get description() { return trs("Violet profond + accents cyan néon (thème par défaut)", "Deep purple + neon cyan accents (default theme)", "Violeta profundo + acentos cian neón (tema por defecto)"); },
    rarity: 'common',
    preview: {
      background: 'linear-gradient(135deg, #0e0a18 0%, #17112a 50%, #1e1836 100%)',
      circle: '#22d3ee',        // cyan for bar
      successZone: '#4ee1a0',   // mint for success arc
    },
  },
  {
    id: 'theme-sunset',
    get name() { return trs("Coucher de Soleil", "Sunset", "Atardecer"); },
    price: 120,
    get description() { return trs("Dégradé orange/ambre avec arc vert contrasté", "Orange/amber gradient with a contrasting green arc", "Degradado naranja/ámbar con arco verde contrastado"); },
    rarity: 'common',
    preview: {
      background: 'linear-gradient(135deg, #7a2e0b 0%, #a74b12 50%, #c97717 100%)',
      circle: '#ffd166',        // warm highlight for bar
      successZone: '#81fbb8',   // bright green for visibility
    },
  },
  {
    id: 'theme-ocean',
    get name() { return trs("Profondeur Océanique", "Ocean Depths", "Profundidad Oceánica"); },
    price: 150,
    get description() { return trs("Bleus profonds + accents turquoise lumineux", "Deep blues + bright turquoise accents", "Azules profundos + acentos turquesa luminosos"); },
    rarity: 'rare',
    preview: {
      background: 'linear-gradient(135deg, #07263f 0%, #0a3a5c 50%, #0f5e82 100%)',
      circle: '#60a5fa',        // light blue bar
      successZone: '#34d399',   // emerald arc for contrast
    },
  },
  {
    id: 'theme-forest',
    get name() { return trs("Forêt Enchantée", "Enchanted Forest", "Bosque Encantado"); },
    price: 150,
    get description() { return trs("Verts profonds + arc lime éclatant", "Deep greens + bright lime arc", "Verdes profundos + arco lima brillante"); },
    rarity: 'rare',
    preview: {
      background: 'linear-gradient(135deg, #0f2e1f 0%, #174a31 50%, #1f6a46 100%)',
      circle: '#86efac',        // soft green bar
      successZone: '#a7f3d0',   // light mint arc
    },
  },
  {
    id: 'theme-volcanic',
    get name() { return trs("Éruption Volcanique", "Volcanic Eruption", "Erupción Volcánica"); },
    price: 200,
    get description() { return trs("Rouges sombres, bar jaune vif, arc vert lisible", "Dark reds, bright yellow bar, readable green arc", "Rojos oscuros, barra amarilla viva, arco verde legible"); },
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #2b0b0b 0%, #4a0f12 50%, #6b1417 100%)',
      circle: '#f59e0b',        // amber bar
      successZone: '#86efac',   // green arc for readability
    },
  },
  {
    id: 'theme-cosmic',
    get name() { return trs("Nébuleuse Cosmique", "Cosmic Nebula", "Nebulosa Cósmica"); },
    price: 260,
    get description() { return trs("Violets cosmiques + accents lavande/vert", "Cosmic purples + lavender/green accents", "Violetas cósmicos + acentos lavanda/verde"); },
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #120826 0%, #2a1556 50%, #3b2f7a 100%)',
      circle: '#a78bfa',        // soft purple bar
      successZone: '#34d399',   // emerald arc for contrast
    },
  },
  {
    id: 'theme-golden',
    get name() { return trs("Luxe Doré", "Golden Luxury", "Lujo Dorado"); },
    price: 240,
    get description() { return trs("Bruns foncés + doré, arc vert contrasté", "Dark browns + gold, contrasting green arc", "Marrones oscuros + dorado, arco verde contrastado"); },
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #2a1e07 0%, #3b2c0a 50%, #4d3a0d 100%)',
      circle: '#facc15',
      successZone: '#4ade80',
    },
  },
  {
    id: 'theme-emerald',
    get name() { return trs("Émeraude Pure", "Pure Emerald", "Esmeralda Pura"); },
    price: 180,
    get description() { return trs("Verts profonds + arc vert clair très visible", "Deep greens + highly visible light green arc", "Verdes profundos + arco verde claro muy visible"); },
    rarity: 'rare',
    preview: {
      background: 'linear-gradient(135deg, #06281f 0%, #0b3b2e 50%, #115543 100%)',
      circle: '#34d399',
      successZone: '#a7f3d0',
    },
  },
  {
    id: 'theme-plasma',
    get name() { return trs("Énergie Plasma", "Plasma Energy", "Energía Plasma"); },
    price: 220,
    get description() { return trs("Bleus électriques + arc vert fluorescent", "Electric blues + fluorescent green arc", "Azules eléctricos + arco verde fluorescente"); },
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #0b1740 0%, #13286b 50%, #1b3b99 100%)',
      circle: '#60a5fa',
      successZone: '#84f7a7',
    },
  },
  {
    id: 'theme-shadow',
    get name() { return trs("Ombres Mystiques", "Mystic Shadows", "Sombras Místicas"); },
    price: 300,
    get description() { return trs("Gris anthracite + accents violet, arc vert lumineux", "Charcoal grey + purple accents, bright green arc", "Gris antracita + acentos violeta, arco verde luminoso"); },
    rarity: 'legendary',
    preview: {
      background: 'linear-gradient(135deg, #0b0b0b 0%, #1a1f24 50%, #2a3340 100%)',
      circle: '#a78bfa',
      successZone: '#34d399',
    },
  },
  {
    id: 'theme-royal',
    get name() { return trs("Majesté Royale", "Royal Majesty", "Majestad Real"); },
    price: -1, // Pas achetable, uniquement via récompense 7 jours
    get description() { return trs("Thème exclusif des fidèles - Or royal et pourpre impérial", "Exclusive theme for loyal players - Royal gold and imperial purple", "Tema exclusivo para fieles - Oro real y púrpura imperial"); },
    rarity: 'legendary',
    preview: {
      background: 'linear-gradient(135deg, #1a0d2e 0%, #2d1b69 50%, #5b21b6 100%)',
      circle: '#fbbf24',
      successZone: '#10b981',
    },
  },
  // Nouveaux skins premium
  {
    id: 'theme-diamond',
    get name() { return trs("Éclat de Diamant", "Diamond Shine", "Brillo de Diamante"); },
    price: 500,
    get description() { return trs("Pureté cristalline avec reflets prismatiques", "Crystal purity with prismatic reflections", "Pureza cristalina con reflejos prismáticos"); },
    rarity: 'legendary',
    preview: {
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1e1e2e 50%, #2a2a3a 100%)',
      circle: '#e0e7ff',
      successZone: '#c7d2fe',
    },
  },
  {
    id: 'theme-phoenix',
    get name() { return trs("Résurrection du Phénix", "Phoenix Rising", "Resurrección del Fénix"); },
    price: 450,
    get description() { return trs("Flammes éternelles aux couleurs incandescentes", "Eternal flames in glowing colors", "Llamas eternas de colores incandescentes"); },
    rarity: 'legendary',
    preview: {
      background: 'linear-gradient(135deg, #7c2d12 0%, #dc2626 50%, #f97316 100%)',
      circle: '#fbbf24',
      successZone: '#84cc16',
    },
  },
  {
    id: 'theme-aurora',
    get name() { return trs("Aurore Boréale", "Northern Lights", "Aurora Boreal"); },
    price: 400,
    get description() { return trs("Lumières polaires dansantes dans la nuit arctique", "Polar lights dancing in the arctic night", "Luces polares danzando en la noche ártica"); },
    rarity: 'legendary',
    preview: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      circle: '#06b6d4',
      successZone: '#10b981',
    },
  },
  {
    id: 'theme-nebula',
    get name() { return trs("Nébuleuse Stellaire", "Stellar Nebula", "Nebulosa Estelar"); },
    price: 380,
    get description() { return trs("Poussières d'étoiles et gaz cosmiques luminescents", "Stardust and glowing cosmic gases", "Polvo de estrellas y gases cósmicos luminiscentes"); },
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #7c3aed 100%)',
      circle: '#f472b6',
      successZone: '#34d399',
    },
  },
  {
    id: 'theme-void',
    get name() { return trs("Abysses du Néant", "Void Abyss", "Abismos de la Nada"); },
    price: 360,
    get description() { return trs("Profondeurs infinies aux lueurs violettes mystérieuses", "Endless depths with mysterious purple glows", "Profundidades infinitas con misteriosos destellos violetas"); },
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)',
      circle: '#8b5cf6',
      successZone: '#06d6a0',
    },
  },
  {
    id: 'theme-crystal',
    get name() { return trs("Caverne de Cristal", "Crystal Cavern", "Caverna de Cristal"); },
    price: 340,
    get description() { return trs("Formations cristallines aux reflets bleu glacé", "Crystal formations with icy blue reflections", "Formaciones cristalinas con reflejos azul hielo"); },
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)',
      circle: '#38bdf8',
      successZone: '#22d3ee',
    },
  },
];
