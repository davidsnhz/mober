import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Márgenes seguros comunes a todas las pantallas, calcados del diseño: 13 pt entre la barra de
 * estado y la cabecera, y el botón principal a 34 pt del borde inferior.
 */
export function useScreenInsets(): { top: number; bottom: number } {
  const insets = useSafeAreaInsets();
  return {
    top: Math.max(insets.top, 8) + 13,
    bottom: Math.max(insets.bottom, 20),
  };
}
