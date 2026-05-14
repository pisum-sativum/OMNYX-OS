export type ThemeId = 'nebula' | 'lumina' | 'terminal' | 'solaris' | 'glassmorph';

export interface ThemeColors {
  bg: string;
  surface1: string;
  surface2: string;
  surface3: string;
  glass1: string;
  glass2: string;
  glass3: string;
  primary: string;
  primaryDim: string;
  primaryGlow: string;
  accent: string;
  accentDim: string;
  threat: string;
  safe: string;
  warning: string;
  textPrimary: string;
  textSecondary: string;
  textDim: string;
  border: string;
  borderDim: string;
  gradientTop: [string, string];
  gradientCard: [string, string];
  ringTrack: string;
  ringFill: string;
  tabBarBg: string;
  tabBarBorder: string;
}

export interface Theme {
  id: ThemeId;
  label: string;
  description: string;
  previewColor: string;
  colors: ThemeColors;
  isDark: boolean;
}

// ─── NEBULA ────────────────────────────────────────────────────────────────────
// Cosmic intelligence · Violet orbital systems · Deep space energy

const NEBULA: Theme = {
  id: 'nebula',
  label: 'NEBULA',
  description: 'Cosmic Intelligence · Deep Space',
  previewColor: '#9966FF',
  isDark: true,
  colors: {
    bg: '#030008',
    surface1: '#0A0020',
    surface2: '#110030',
    surface3: '#180044',
    glass1: 'rgba(153,102,255,0.07)',
    glass2: 'rgba(153,102,255,0.12)',
    glass3: 'rgba(153,102,255,0.20)',
    primary: '#9966FF',
    primaryDim: '#6633CC',
    primaryGlow: '#BB88FF',
    accent: '#00CCFF',
    accentDim: 'rgba(0,204,255,0.14)',
    threat: '#FF1144',
    safe: '#00FF88',
    warning: '#FFBB00',
    textPrimary: '#EEE8FF',
    textSecondary: '#8877BB',
    textDim: '#3D2D66',
    border: 'rgba(153,102,255,0.28)',
    borderDim: 'rgba(153,102,255,0.08)',
    gradientTop: ['rgba(100,40,220,0.28)', 'transparent'],
    gradientCard: ['#0A0020', '#030008'],
    ringTrack: 'rgba(153,102,255,0.10)',
    ringFill: '#9966FF',
    tabBarBg: 'rgba(3,0,8,0.96)',
    tabBarBorder: 'rgba(153,102,255,0.24)',
  },
};

// ─── TERMINAL ──────────────────────────────────────────────────────────────────
// Tactical surveillance · Radar systems · Cyber-defense

const TERMINAL: Theme = {
  id: 'terminal',
  label: 'TERMINAL',
  description: 'Tactical Surveillance · Cyber Defense',
  previewColor: '#00FF41',
  isDark: true,
  colors: {
    bg: '#000000',
    surface1: '#030F03',
    surface2: '#061506',
    surface3: '#0A1E0A',
    glass1: 'rgba(0,255,65,0.04)',
    glass2: 'rgba(0,255,65,0.08)',
    glass3: 'rgba(0,255,65,0.14)',
    primary: '#00FF41',
    primaryDim: '#00BB30',
    primaryGlow: '#44FF66',
    accent: '#00FFCC',
    accentDim: 'rgba(0,255,204,0.10)',
    threat: '#FF3B3B',
    safe: '#00FF41',
    warning: '#FFDD00',
    textPrimary: '#AAFFBB',
    textSecondary: '#448855',
    textDim: '#1A3A1A',
    border: 'rgba(0,255,65,0.20)',
    borderDim: 'rgba(0,255,65,0.06)',
    gradientTop: ['rgba(0,255,65,0.10)', 'transparent'],
    gradientCard: ['#061506', '#030F03'],
    ringTrack: 'rgba(0,255,65,0.10)',
    ringFill: '#00FF41',
    tabBarBg: 'rgba(0,0,0,0.97)',
    tabBarBorder: 'rgba(0,255,65,0.20)',
  },
};

// ─── SOLARIS ───────────────────────────────────────────────────────────────────
// Golden tactical holograms · Solar flare atmospherics · Command intelligence

const SOLARIS: Theme = {
  id: 'solaris',
  label: 'SOLARIS',
  description: 'Golden Intelligence · Solar Command',
  previewColor: '#FF8800',
  isDark: true,
  colors: {
    bg: '#050100',
    surface1: '#0F0400',
    surface2: '#160600',
    surface3: '#200800',
    glass1: 'rgba(255,136,0,0.07)',
    glass2: 'rgba(255,136,0,0.11)',
    glass3: 'rgba(255,136,0,0.18)',
    primary: '#FF8800',
    primaryDim: '#CC6600',
    primaryGlow: '#FFAA33',
    accent: '#FFD700',
    accentDim: 'rgba(255,215,0,0.14)',
    threat: '#FF3333',
    safe: '#88FF00',
    warning: '#FFD700',
    textPrimary: '#FFE8AA',
    textSecondary: '#AA7733',
    textDim: '#4A2800',
    border: 'rgba(255,136,0,0.25)',
    borderDim: 'rgba(255,136,0,0.07)',
    gradientTop: ['rgba(255,90,0,0.22)', 'transparent'],
    gradientCard: ['#160600', '#0F0400'],
    ringTrack: 'rgba(255,136,0,0.10)',
    ringFill: '#FF8800',
    tabBarBg: 'rgba(5,1,0,0.97)',
    tabBarBorder: 'rgba(255,136,0,0.24)',
  },
};

// ─── GLASSMORPH ────────────────────────────────────────────────────────────────
// Translucent intelligence layers · Premium glass reflections · Calm AI

const GLASSMORPH: Theme = {
  id: 'glassmorph',
  label: 'GLASS',
  description: 'Translucent Intelligence · Premium Glass',
  previewColor: '#C4A0FF',
  isDark: true,
  colors: {
    bg: '#0D0628',
    surface1: 'rgba(255,255,255,0.07)',
    surface2: 'rgba(255,255,255,0.11)',
    surface3: 'rgba(255,255,255,0.16)',
    glass1: 'rgba(255,255,255,0.05)',
    glass2: 'rgba(255,255,255,0.09)',
    glass3: 'rgba(255,255,255,0.14)',
    primary: '#C4A0FF',
    primaryDim: '#9B70DD',
    primaryGlow: '#E0C8FF',
    accent: '#FF80C8',
    accentDim: 'rgba(255,128,200,0.16)',
    threat: '#FF5577',
    safe: '#44FFAA',
    warning: '#FFCC44',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.62)',
    textDim: 'rgba(255,255,255,0.28)',
    border: 'rgba(255,255,255,0.16)',
    borderDim: 'rgba(255,255,255,0.08)',
    gradientTop: ['rgba(190,120,255,0.18)', 'transparent'],
    gradientCard: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)'],
    ringTrack: 'rgba(196,160,255,0.12)',
    ringFill: '#C4A0FF',
    tabBarBg: 'rgba(13,6,40,0.92)',
    tabBarBorder: 'rgba(255,255,255,0.12)',
  },
};

// ─── LUMINA ────────────────────────────────────────────────────────────────────
// Ultra minimal luxury · Soft white environment · Elegant futuristic calm

const LUMINA: Theme = {
  id: 'lumina',
  label: 'LUMINA',
  description: 'Ultra Minimal Luxury · Elegant Calm',
  previewColor: '#B8860B',
  isDark: false,
  colors: {
    bg: '#F5F0E8',
    surface1: '#FFFFFF',
    surface2: '#F0EBE0',
    surface3: '#E8E2D6',
    glass1: 'rgba(184,134,11,0.06)',
    glass2: 'rgba(184,134,11,0.10)',
    glass3: 'rgba(184,134,11,0.16)',
    primary: '#B8860B',
    primaryDim: '#8B6508',
    primaryGlow: '#D4A833',
    accent: '#5B8A4A',
    accentDim: 'rgba(91,138,74,0.12)',
    threat: '#C0392B',
    safe: '#5B8A4A',
    warning: '#B8860B',
    textPrimary: '#1A1008',
    textSecondary: '#5A4A28',
    textDim: '#A09070',
    border: 'rgba(184,134,11,0.18)',
    borderDim: 'rgba(0,0,0,0.07)',
    gradientTop: ['rgba(184,134,11,0.08)', 'transparent'],
    gradientCard: ['#FFFFFF', '#F5F0E8'],
    ringTrack: 'rgba(184,134,11,0.12)',
    ringFill: '#B8860B',
    tabBarBg: 'rgba(245,240,232,0.97)',
    tabBarBorder: 'rgba(0,0,0,0.07)',
  },
};

export const THEMES: Record<ThemeId, Theme> = {
  nebula: NEBULA,
  lumina: LUMINA,
  terminal: TERMINAL,
  solaris: SOLARIS,
  glassmorph: GLASSMORPH,
};

export const THEME_LIST: Theme[] = [NEBULA, TERMINAL, SOLARIS, GLASSMORPH, LUMINA];
