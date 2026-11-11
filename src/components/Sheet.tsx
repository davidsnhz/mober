import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { CheckIcon } from './icons';
import { Touchable } from './Touchable';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  children?: ReactNode;
}

/** Hoja inferior: base de los menús, selectores y confirmaciones. Funciona igual en web. */
export function Sheet({ visible, onClose, title, message, children }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'web' ? undefined : 'padding'}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}
      >
        <Pressable
          accessibilityLabel="Cerrar"
          accessibilityRole="button"
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.backdrop,
          }}
        />
        <Animated.View
          entering={SlideInDown.duration(240)}
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: layout.maxWebWidth,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 10,
            paddingHorizontal: layout.screenPadding,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.line,
              marginBottom: 14,
            }}
          />
          {title ? (
            <AppText size={17} weight="semibold" accessibilityRole="header">
              {title}
            </AppText>
          ) : null}
          {message ? (
            <AppText size={15} secondary style={{ marginTop: 6, lineHeight: 21 }}>
              {message}
            </AppText>
          ) : null}
          <View style={{ marginTop: title || message ? 14 : 0 }}>{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export interface SheetOption {
  key: string;
  label: string;
  /** Texto secundario bajo la etiqueta. */
  detail?: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

interface OptionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: readonly SheetOption[];
  /** Clave de la opción activa; se marca con un check verde. */
  selectedKey?: string;
  /** Nota discreta al pie de la hoja. */
  footnote?: string;
}

/** Hoja con una lista de opciones: menú "···" y selectores de Ajustes. */
export function OptionSheet({
  visible,
  onClose,
  title,
  message,
  options,
  selectedKey,
  footnote,
}: OptionSheetProps) {
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title} message={message}>
      {options.map((option, index) => {
        const selected = option.key === selectedKey;
        return (
          <Touchable
            key={option.key}
            disabled={option.disabled}
            accessibilityLabel={option.label}
            accessibilityState={{ selected, disabled: option.disabled }}
            pressedScale={1}
            pressedOpacity={0.5}
            onPress={() => {
              onClose();
              option.onPress();
            }}
            style={{
              minHeight: 52,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              paddingVertical: 8,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: colors.separator,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <AppText
                size={16}
                weight={selected ? 'semibold' : 'regular'}
                color={option.destructive ? colors.danger : colors.text}
              >
                {option.label}
              </AppText>
              {option.detail ? (
                <AppText size={12} secondary>
                  {option.detail}
                </AppText>
              ) : null}
            </View>
            {selected ? <CheckIcon size={20} color={colors.accentText} /> : null}
          </Touchable>
        );
      })}
      {footnote ? (
        <AppText size={12} secondary style={{ marginTop: 10 }}>
          {footnote}
        </AppText>
      ) : null}
    </Sheet>
  );
}

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación antes de una acción que no se puede deshacer. */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} onClose={onCancel} title={title} message={message}>
      <View style={{ gap: 8, marginTop: 4 }}>
        <Touchable
          accessibilityLabel={confirmLabel}
          onPress={onConfirm}
          style={{
            height: layout.buttonHeight,
            borderRadius: layout.buttonHeight / 2,
            backgroundColor: destructive ? colors.danger : colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText size={17} weight="semibold" color={destructive ? '#FFFFFF' : colors.onAccent}>
            {confirmLabel}
          </AppText>
        </Touchable>
        <Button label="Cancelar" variant="ghost" onPress={onCancel} />
      </View>
    </Sheet>
  );
}
