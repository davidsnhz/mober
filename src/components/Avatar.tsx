import { View } from 'react-native';

import { initials } from '@/lib/text';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

interface AvatarProps {
  name: string;
  size?: number;
  /** Avatar negro del detalle de persona. */
  strong?: boolean;
}

/** Círculo con las iniciales de la persona. Sin fotos ni ilustraciones. */
export function Avatar({ name, size = 44, strong = false }: AvatarProps) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: strong ? colors.avatarStrong : colors.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <AppText
        size={Math.round(size * 0.34)}
        weight="semibold"
        color={strong ? colors.onAvatarStrong : colors.text}
        maxFontSizeMultiplier={1}
      >
        {initials(name)}
      </AppText>
    </View>
  );
}
