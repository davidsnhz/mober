import { useState, type Ref } from 'react';
import { TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { fonts, radius, useTheme } from '@/theme';

import { AppText } from './AppText';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  ref?: Ref<TextInputInstance>;
  label: string;
  /** Fondo en reposo; por defecto el de los controles sobre una pantalla modal. */
  background?: string;
  /** Fondo al recibir el foco. */
  focusedBackground?: string;
}

/** Campo de texto con etiqueta. Al recibir el foco muestra un borde negro de 2 pt. */
export function TextField({
  ref,
  label,
  background,
  focusedBackground,
  onFocus,
  onBlur,
  multiline,
  ...rest
}: TextFieldProps) {
  const { colors, dark } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <AppText size={13} weight="semibold" secondary style={{ paddingLeft: 4 }}>
        {label}
      </AppText>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accentText}
        keyboardAppearance={dark ? 'dark' : 'light'}
        maxFontSizeMultiplier={1.3}
        multiline={multiline}
        {...rest}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={{
          minHeight: multiline ? 120 : 52,
          borderRadius: radius.field,
          borderWidth: 2,
          borderColor: focused ? colors.text : 'transparent',
          backgroundColor: focused
            ? (focusedBackground ?? colors.modalBackground)
            : (background ?? colors.modalControl),
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          fontFamily: fonts.regular,
          fontSize: 16,
          color: colors.text,
          textAlignVertical: multiline ? 'top' : 'center',
          outlineWidth: 0,
        }}
      />
    </View>
  );
}
