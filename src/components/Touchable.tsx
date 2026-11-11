import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/** Opacidad de cualquier control desactivado. */
const DISABLED_OPACITY = 0.4;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface TouchableProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Escala al pulsar. 1 desactiva el efecto. */
  pressedScale?: number;
  pressedOpacity?: number;
}

/** Pulsable con respuesta suave (escala y opacidad) animada fuera del hilo de JavaScript. */
export function Touchable({
  style,
  children,
  pressedScale = 0.97,
  pressedOpacity = 0.85,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: TouchableProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - pressedScale) }],
    opacity: (disabled ? DISABLED_OPACITY : 1) * (1 - pressed.value * (1 - pressedOpacity)),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        pressed.value = withTiming(1, { duration: 90 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withTiming(0, { duration: 160 });
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
