import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { hapticTap } from '@/lib/haptics';
import { palette, useTheme } from '@/theme';

interface SwitchProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const KNOB = 22;
const PADDING = 3;

/** Interruptor de 48×28 pt: verde cuando está activo. */
export function Switch({ label, value, onChange, disabled = false }: SwitchProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 160 });
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.switchOff, colors.accent]),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (TRACK_WIDTH - KNOB - PADDING * 2) }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        hapticTap();
        onChange(!value);
      }}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Animated.View
        style={[
          {
            width: TRACK_WIDTH,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            padding: PADDING,
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            { width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: palette.white },
            knobStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
