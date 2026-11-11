/**
 * Tokens de diseño de Mober. Único origen de colores, tipografía, radios y espaciados.
 * Regla de marca: el verde nunca ocupa más del 10 % de la pantalla.
 */

export const palette = {
  ink: '#0B0B0C',
  white: '#FFFFFF',
  fog: '#F4F4F2',
  line: '#E5E5E1',
  separator: '#EDEDEA',
  textGrey: '#6E6E6A',
  green: '#00C26F',
  greenText: '#067A46',
  greenNight: '#2EE88C',
  greenSoft: '#E3F7EC',
  black: '#000000',
  nightCard: '#161618',
  nightChip: '#26262A',
  nightTextGrey: '#9A9A96',
} as const;

export interface ThemeColors {
  /** Fondo general de la pantalla. */
  background: string;
  /** Tarjetas y listas. */
  surface: string;
  /** Avatares, chips y campos sobre una tarjeta. */
  surfaceMuted: string;
  /** Fondo de las pantallas modales. */
  modalBackground: string;
  /** Controles (campos, botón de cerrar) sobre el fondo modal. */
  modalControl: string;
  /** Tarjeta del total en Inicio. */
  heroCard: string;
  heroText: string;
  heroLabel: string;
  heroChip: string;
  text: string;
  textSecondary: string;
  separator: string;
  line: string;
  /** Verde de marca: botones principales, interruptores y el símbolo €. */
  accent: string;
  /** Texto sobre el verde: siempre negro tinta. */
  onAccent: string;
  /** Verde legible para enlaces y texto. */
  accentText: string;
  /** Verde muy suave: burbuja del mensaje y check de pagado. */
  accentSoft: string;
  /** Superficie de máximo contraste: etiqueta "+30 días", chip seleccionado. */
  inverse: string;
  onInverse: string;
  /** Avatar grande del detalle de persona. */
  avatarStrong: string;
  onAvatarStrong: string;
  switchOff: string;
  dashedBorder: string;
  danger: string;
  backdrop: string;
}

export const lightColors: ThemeColors = {
  background: palette.fog,
  surface: palette.white,
  surfaceMuted: palette.fog,
  modalBackground: palette.white,
  modalControl: palette.fog,
  heroCard: palette.ink,
  heroText: palette.white,
  heroLabel: '#A3A3A0',
  heroChip: '#1F1F21',
  text: palette.ink,
  textSecondary: palette.textGrey,
  separator: palette.separator,
  line: palette.line,
  accent: palette.green,
  onAccent: palette.ink,
  accentText: palette.greenText,
  accentSoft: palette.greenSoft,
  inverse: palette.ink,
  onInverse: palette.white,
  avatarStrong: palette.ink,
  onAvatarStrong: palette.white,
  switchOff: '#DCDCD8',
  dashedBorder: '#B5B5B0',
  danger: '#C4321F',
  backdrop: 'rgba(11, 11, 12, 0.45)',
};

export const darkColors: ThemeColors = {
  background: palette.black,
  surface: palette.nightCard,
  surfaceMuted: palette.nightChip,
  modalBackground: palette.black,
  modalControl: palette.nightCard,
  heroCard: palette.nightCard,
  heroText: palette.white,
  heroLabel: '#A3A3A0',
  heroChip: palette.nightChip,
  text: palette.white,
  textSecondary: palette.nightTextGrey,
  separator: palette.nightChip,
  line: palette.nightChip,
  accent: palette.greenNight,
  onAccent: palette.ink,
  accentText: palette.greenNight,
  accentSoft: '#12301F',
  inverse: palette.white,
  onInverse: palette.ink,
  avatarStrong: palette.nightChip,
  onAvatarStrong: palette.white,
  switchOff: '#3A3A3E',
  dashedBorder: '#4A4A4E',
  danger: '#FF6B57',
  backdrop: 'rgba(0, 0, 0, 0.6)',
};

/** Familias de Inter cargadas con @expo-google-fonts/inter. */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const radius = {
  field: 14,
  card: 18,
  list: 20,
  hero: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const layout = {
  /** Margen lateral de todas las pantallas. */
  screenPadding: 20,
  /** Alto de los botones principales en píldora. */
  buttonHeight: 56,
  /** Área táctil mínima. */
  touchTarget: 44,
  /** Ancho máximo de la app en web de escritorio. */
  maxWebWidth: 430,
} as const;

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  dark: boolean;
  colors: ThemeColors;
}

export const themes: Record<ThemeName, Theme> = {
  light: { name: 'light', dark: false, colors: lightColors },
  dark: { name: 'dark', dark: true, colors: darkColors },
};
