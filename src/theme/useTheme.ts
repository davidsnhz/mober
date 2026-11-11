import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/useSettingsStore';

import { themes, type Theme } from './theme';

/** Tema activo: el elegido en Ajustes o, en "Automático", el del sistema. */
export function useTheme(): Theme {
  const preference = useSettingsStore((state) => state.settings.theme);
  const system = useColorScheme();
  if (preference === 'auto') return system === 'dark' ? themes.dark : themes.light;
  return themes[preference];
}
