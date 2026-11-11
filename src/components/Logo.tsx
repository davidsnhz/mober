import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

/** Logotipo: "mober" en Inter 700 minúscula con un € pequeño y verde arriba a la derecha. */
export function Logo({ size = 26 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel="Mober"
      style={{ flexDirection: 'row', alignItems: 'flex-start' }}
    >
      <AppText
        size={size}
        weight="bold"
        maxFontSizeMultiplier={1}
        style={{ letterSpacing: -0.04 * size, lineHeight: size * 1.2 }}
      >
        mober
      </AppText>
      <AppText
        size={size / 2}
        weight="bold"
        color={colors.accent}
        maxFontSizeMultiplier={1}
        style={{ marginLeft: 2, lineHeight: size / 2, marginTop: size * 0.14 }}
      >
        €
      </AppText>
    </View>
  );
}
