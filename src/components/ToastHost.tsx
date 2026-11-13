import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '@/store/useToastStore';
import { layout, palette, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Touchable } from './Touchable';

const DEFAULT_DURATION_MS = 5000;

/** Aviso flotante con acción opcional ("Deshacer"). Se monta una sola vez en la raíz. */
export function ToastHost() {
  const toast = useToastStore((state) => state.toast);
  const hide = useToastStore((state) => state.hide);
  const { dark } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hide, toast.durationMs ?? DEFAULT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, hide]);

  if (!toast) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom:
          Math.max(insets.bottom, 16) + 8 + (toast.aboveButton ? layout.buttonHeight + 12 : 0),
        alignItems: 'center',
      }}
    >
      <Animated.View
        key={toast.id}
        entering={FadeInDown.duration(220)}
        exiting={FadeOutDown.duration(180)}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={{
          minHeight: 52,
          maxWidth: 398,
          width: '100%',
          borderRadius: 16,
          backgroundColor: dark ? palette.nightChip : palette.ink,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 16,
          paddingRight: 6,
          gap: 8,
        }}
      >
        <AppText size={15} weight="medium" color={palette.white} style={{ flex: 1 }}>
          {toast.message}
        </AppText>
        {toast.actionLabel ? (
          <Touchable
            accessibilityLabel={toast.actionLabel}
            onPress={() => {
              toast.onAction?.();
              hide();
            }}
            style={{
              minHeight: 44,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText size={15} weight="semibold" color={dark ? palette.greenNight : palette.green}>
              {toast.actionLabel}
            </AppText>
          </Touchable>
        ) : null}
      </Animated.View>
    </View>
  );
}
