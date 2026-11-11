import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Touchable } from './Touchable';

interface ChipProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
  /** Chip "+ Nueva": borde discontinuo en lugar de fondo. */
  dashed?: boolean;
  /** Fondo en reposo; por defecto el de los controles sobre una pantalla modal. */
  background?: string;
  accessibilityLabel?: string;
}

/** Chip de 36 pt de alto, con margen táctil extra hasta los 44 pt. */
export function Chip({
  label,
  onPress,
  selected = false,
  dashed = false,
  background,
  accessibilityLabel,
}: ChipProps) {
  const { colors } = useTheme();

  const backgroundColor = selected
    ? colors.inverse
    : dashed
      ? 'transparent'
      : (background ?? colors.modalControl);

  return (
    <Touchable
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={{
        height: 36,
        borderRadius: 18,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        borderWidth: dashed && !selected ? 1 : 0,
        borderStyle: 'dashed',
        borderColor: colors.dashedBorder,
      }}
    >
      <AppText size={14} weight="medium" color={selected ? colors.onInverse : colors.text}>
        {label}
      </AppText>
    </Touchable>
  );
}
