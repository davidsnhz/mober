import { Text, type TextProps, type TextStyle } from 'react-native';

import { fonts, useTheme } from '@/theme';

export type FontWeight = keyof typeof fonts;

export interface AppTextProps extends TextProps {
  size?: number;
  weight?: FontWeight;
  color?: string;
  /** Usa el gris de texto secundario del tema. */
  secondary?: boolean;
  /** Cifras tabulares: obligatorio en cualquier cantidad. */
  tabular?: boolean;
  align?: TextStyle['textAlign'];
}

/** Texto base de la app: Inter, color del tema y escalado de fuente acotado. */
export function AppText({
  size = 16,
  weight = 'regular',
  color,
  secondary = false,
  tabular = false,
  align,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      {...rest}
      style={[
        {
          fontFamily: fonts[weight],
          fontSize: size,
          color: color ?? (secondary ? colors.textSecondary : colors.text),
          textAlign: align,
        },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}
