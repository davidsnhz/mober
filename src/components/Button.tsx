import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { layout, radius, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Touchable } from './Touchable';

interface ButtonProps {
  label: string;
  onPress: () => void;
  /** primary: verde con texto negro. outline: borde negro. danger y ghost: solo texto. */
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  icon?: ReactNode;
  disabled?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

/** Botón en píldora de 56 pt de alto. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  height = layout.buttonHeight,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = useTheme();

  const background = variant === 'primary' ? colors.accent : 'transparent';
  const textColor =
    variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.danger : colors.text;

  return (
    <Touchable
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          height,
          borderRadius: radius.pill,
          backgroundColor: background,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: colors.text,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 20,
        },
        style,
      ]}
    >
      {icon}
      <AppText size={height >= 56 ? 17 : 16} weight="semibold" color={textColor} numberOfLines={1}>
        {label}
      </AppText>
    </Touchable>
  );
}
