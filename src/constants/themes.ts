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
    name: 'Néon Électrique',
    price: 0,
    description: 'Violet profond + accents cyan néon (thème par défaut)',
    rarity: 'common',
    preview: {
      background: 'linear-gradient(135deg, #0e0a18 0%, #17112a 50%, #1e1836 100%)',
      circle: '#22d3ee',        // cyan for bar
      successZone: '#4ee1a0',   // mint for success arc
    },
  },
  {
    id: 'theme-sunset',
    name: 'Coucher de Soleil',
    price: 120,
    description: 'Dégradé orange/ambre avec arc vert contrasté',
    rarity: 'common',
    preview: {
      background: 'linear-gradient(135deg, #7a2e0b 0%, #a74b12 50%, #c97717 100%)',
      circle: '#ffd166',        // warm highlight for bar
      successZone: '#81fbb8',   // bright green for visibility
    },
  },
  {
    id: 'theme-ocean',
    name: 'Profondeur Océanique',
    price: 150,
    description: 'Bleus profonds + accents turquoise lumineux',
    rarity: 'rare',
    preview: {
      background: 'linear-gradient(135deg, #07263f 0%, #0a3a5c 50%, #0f5e82 100%)',
      circle: '#60a5fa',        // light blue bar
      successZone: '#34d399',   // emerald arc for contrast
    },
  },
  {
    id: 'theme-forest',
    name: 'Forêt Enchantée',
    price: 150,
    description: 'Verts profonds + arc lime éclatant',
    rarity: 'rare',
    preview: {
      background: 'linear-gradient(135deg, #0f2e1f 0%, #174a31 50%, #1f6a46 100%)',
      circle: '#86efac',        // soft green bar
      successZone: '#a7f3d0',   // light mint arc
    },
  },
  {
    id: 'theme-volcanic',
    name: 'Éruption Volcanique',
    price: 200,
    description: 'Rouges sombres, bar jaune vif, arc vert lisible',
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #2b0b0b 0%, #4a0f12 50%, #6b1417 100%)',
      circle: '#f59e0b',        // amber bar
      successZone: '#86efac',   // green arc for readability
    },
  },
  {
    id: 'theme-cosmic',
    name: 'Nébuleuse Cosmique',
    price: 260,
    description: 'Violets cosmiques + accents lavande/vert',
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #120826 0%, #2a1556 50%, #3b2f7a 100%)',
      circle: '#a78bfa',        // soft purple bar
      successZone: '#34d399',   // emerald arc for contrast
    },
  },
  {
    id: 'theme-golden',
    name: 'Luxe Doré',
    price: 240,
    description: 'Bruns foncés + doré, arc vert contrasté',
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #2a1e07 0%, #3b2c0a 50%, #4d3a0d 100%)',
      circle: '#facc15',
      successZone: '#4ade80',
    },
  },
  {
    id: 'theme-emerald',
    name: 'Émeraude Pure',
    price: 180,
    description: 'Verts profonds + arc vert clair très visible',
    rarity: 'rare',
    preview: {
      background: 'linear-gradient(135deg, #06281f 0%, #0b3b2e 50%, #115543 100%)',
      circle: '#34d399',
      successZone: '#a7f3d0',
    },
  },
  {
    id: 'theme-plasma',
    name: 'Énergie Plasma',
    price: 220,
    description: 'Bleus électriques + arc vert fluorescent',
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #0b1740 0%, #13286b 50%, #1b3b99 100%)',
      circle: '#60a5fa',
      successZone: '#84f7a7',
    },
  },
  {
    id: 'theme-shadow',
    name: 'Ombres Mystiques',
    price: 300,
    description: 'Gris anthracite + accents violet, arc vert lumineux',
    rarity: 'legendary',
    preview: {
      background: 'linear-gradient(135deg, #0b0b0b 0%, #1a1f24 50%, #2a3340 100%)',
      circle: '#a78bfa',
      successZone: '#34d399',
    },
  },
  {
    id: 'theme-royal',
    name: 'Majesté Royale',
    price: -1, // Pas achetable, uniquement via récompense 7 jours
    description: 'Thème exclusif des fidèles - Or royal et pourpre impérial',
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
    name: 'Éclat de Diamant',
    price: 500,
    description: 'Pureté cristalline avec reflets prismatiques',
    rarity: 'legendary',
    preview: {
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1e1e2e 50%, #2a2a3a 100%)',
      circle: '#e0e7ff',
      successZone: '#c7d2fe',
    },
  },
  {
    id: 'theme-phoenix',
    name: 'Résurrection du Phénix',
    price: 450,
    description: 'Flammes éternelles aux couleurs incandescentes',
    rarity: 'legendary',
    preview: {
      background: 'linear-gradient(135deg, #7c2d12 0%, #dc2626 50%, #f97316 100%)',
      circle: '#fbbf24',
      successZone: '#84cc16',
    },
  },
  {
    id: 'theme-aurora',
    name: 'Aurore Boréale',
    price: 400,
    description: 'Lumières polaires dansantes dans la nuit arctique',
    rarity: 'legendary',
    preview: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      circle: '#06b6d4',
      successZone: '#10b981',
    },
  },
  {
    id: 'theme-nebula',
    name: 'Nébuleuse Stellaire',
    price: 380,
    description: 'Poussières d\'étoiles et gaz cosmiques luminescents',
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #7c3aed 100%)',
      circle: '#f472b6',
      successZone: '#34d399',
    },
  },
  {
    id: 'theme-void',
    name: 'Abysses du Néant',
    price: 360,
    description: 'Profondeurs infinies aux lueurs violettes mystérieuses',
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)',
      circle: '#8b5cf6',
      successZone: '#06d6a0',
    },
  },
  {
    id: 'theme-crystal',
    name: 'Caverne de Cristal',
    price: 340,
    description: 'Formations cristallines aux reflets bleu glacé',
    rarity: 'epic',
    preview: {
      background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)',
      circle: '#38bdf8',
      successZone: '#22d3ee',
    },
  },
];
