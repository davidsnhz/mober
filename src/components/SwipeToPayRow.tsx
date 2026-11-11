import type { ReactNode } from 'react';
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

/** Ancho de la zona verde "Pagado" que se descubre al deslizar. */
const REVEAL_WIDTH = 96;
/** Distancia a partir de la cual soltar marca la deuda como pagada. */
const COMMIT_DISTANCE = 96;
const ROW_HEIGHT = 64;

interface SwipeToPayRowProps {
  children: ReactNode;
  /** Se llama cuando el gesto termina pasado el umbral. */
  onPaid: () => void;
}

/**
 * Fila que se desliza hacia la derecha y descubre un fondo verde "Pagado". Toda la animación
 * corre en el hilo de interfaz; solo se vuelve a JavaScript al confirmar el gesto.
 */
export function SwipeToPayRow({ children, onPaid }: SwipeToPayRowProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);
  const rowWidth = useSharedValue(0);
  const armed = useSharedValue(false);

  const pan = usePanGesture({
    // Solo hacia la derecha, y cede el gesto al scroll vertical de la pantalla.
    activeOffsetX: 14,
    failOffsetY: [-12, 12],
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

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [8, 48], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(translateX.value, [0, COMMIT_DISTANCE], [0.85, 1], 'clamp') }],
  }));

  return (
    <View
      onLayout={(event) => {
        rowWidth.value = event.nativeEvent.layout.width;
      }}
      style={{ height: ROW_HEIGHT, backgroundColor: colors.accent, overflow: 'hidden' }}
    >
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
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
