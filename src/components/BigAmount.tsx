import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

interface BigAmountProps {
  /** Texto de la cantidad sin símbolo: "147,50". */
  value: string;
  /** Tamaño de la cifra: 48 en Inicio y detalle, 56 en Nueva deuda. */
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}

/**
 * Cantidad protagonista: cifra en semibold con tracking negativo y el símbolo € a un ~60 % del
 * tamaño, en verde. La cifra va en el color del texto (blanca en oscuro), nunca en verde.
 */
export function BigAmount({ value, size = 48, color, accessibilityLabel }: BigAmountProps) {
  const { colors } = useTheme();
  const euroSize = Math.round(size * 0.62);
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? `${value} euros`}
      style={{ flexDirection: 'row', alignItems: 'baseline' }}
    >
      <AppText
        size={size}
        weight="semibold"
        tabular
        color={color ?? colors.text}
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        style={{ letterSpacing: -0.035 * size, lineHeight: size * 1.15 }}
      >
        {value}
      </AppText>
      <AppText
        size={euroSize}
        weight="semibold"
        color={colors.accent}
        maxFontSizeMultiplier={1}
        style={{ marginLeft: 6, lineHeight: size * 1.15 }}
      >
        €
      </AppText>
    </View>
  );
}
