import { useCallback, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { hapticTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { CheckIcon } from './icons';
import { Touchable } from './Touchable';

/** Ancho de la zona verde "Pagado" que se descubre al deslizar. */
const REVEAL_WIDTH = 96;
/** Distancia a partir de la cual soltar marca la deuda como pagada. */
const COMMIT_DISTANCE = 96;
const ROW_HEIGHT = 64;
/** Tras un deslizamiento, las pulsaciones se ignoran durante este tiempo. */
const PRESS_GUARD_MS = 400;

interface SwipeToPayRowProps {
  children: ReactNode;
  /** Se llama cuando el gesto termina pasado el umbral. */
  onPaid: () => void;
  /** Pulsación sobre la fila (no se dispara al soltar un deslizamiento). */
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * Fila que se desliza hacia la derecha y descubre un fondo verde "Pagado". Toda la animación
 * corre en el hilo de interfaz; solo se vuelve a JavaScript al confirmar el gesto.
 */
export function SwipeToPayRow({
  children,
  onPaid,
  onPress,
  accessibilityLabel,
}: SwipeToPayRowProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);
  const rowWidth = useSharedValue(0);
  const armed = useSharedValue(false);

  // Soltar el gesto no debe contar como una pulsación sobre la fila.
  const lastSwipeAt = useRef(0);
  const markSwipe = useCallback(() => {
    lastSwipeAt.current = Date.now();
  }, []);

  const pan = usePanGesture({
    // Solo hacia la derecha, y cede el gesto al scroll vertical de la pantalla.
    activeOffsetX: 14,
    failOffsetY: [-12, 12],
    onActivate: () => {
      'worklet';
      scheduleOnRN(markSwipe);
    },
    onUpdate: (event) => {
      'worklet';
      const next = Math.max(0, event.translationX);
      translateX.value = next;
      const isArmed = next >= COMMIT_DISTANCE;
      if (isArmed !== armed.value) {
        armed.value = isArmed;
        scheduleOnRN(hapticTap);
      }
    },
    onDeactivate: (event) => {
      'worklet';
      scheduleOnRN(markSwipe);
      const flung = event.velocityX > 900 && translateX.value > REVEAL_WIDTH / 2;
      if (translateX.value >= COMMIT_DISTANCE || flung) {
        translateX.value = withTiming(rowWidth.value, { duration: 180 }, (finished) => {
          if (finished) scheduleOnRN(onPaid);
        });
      } else {
        translateX.value = withSpring(0, { damping: 22, stiffness: 240 });
      }
      armed.value = false;
    },
  });

  const contentStyle = useAnimatedStyle(() => {
    const corner = interpolate(translateX.value, [0, 24], [0, 14], 'clamp');
    return {
      transform: [{ translateX: translateX.value }],
      borderTopLeftRadius: corner,
      borderBottomLeftRadius: corner,
    };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0.5 ? 1 : 0,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [8, 48], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(translateX.value, [0, COMMIT_DISTANCE], [0.85, 1], 'clamp') }],
  }));

  return (
    <View
      onLayout={(event) => {
        rowWidth.value = event.nativeEvent.layout.width;
      }}
      style={{ height: ROW_HEIGHT, backgroundColor: colors.surface, overflow: 'hidden' }}
    >
      {/* El fondo verde solo existe mientras se desliza: en reposo no asoma por los bordes. */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: colors.accent,
          },
          backdropStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: REVEAL_WIDTH,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          },
          labelStyle,
        ]}
      >
        <CheckIcon size={18} color={colors.onAccent} />
        <AppText size={14} weight="semibold" color={colors.onAccent}>
          Pagado
        </AppText>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: colors.surface,
            },
            contentStyle,
          ]}
        >
          <Touchable
            onPress={() => {
              if (Date.now() - lastSwipeAt.current < PRESS_GUARD_MS) return;
              onPress();
            }}
            pressedScale={1}
            pressedOpacity={0.6}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint="Toca para editar. Desliza a la derecha para marcar como pagado"
            accessibilityActions={[{ name: 'pagar', label: 'Marcar como pagado' }]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'pagar') onPaid();
            }}
            style={{ flex: 1 }}
          >
            {children}
          </Touchable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
