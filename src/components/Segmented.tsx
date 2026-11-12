import { View } from 'react-native';

import { hapticTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Touchable } from './Touchable';

interface SegmentedProps<T extends string> {
  options: readonly { key: T; label: string }[];
  /** Opción activa; null si ninguna lo está. */
  value: T | null;
  onChange: (value: T) => void;
}

/** Selector segmentado: la opción activa va en negro con texto blanco. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        gap: 4,
        backgroundColor: colors.surfaceMuted,
        borderRadius: 12,
        padding: 4,
      }}
    >
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Touchable
            key={option.key}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            hitSlop={{ top: 5, bottom: 5 }}
            onPress={() => {
              if (selected) return;
              hapticTap();
              onChange(option.key);
            }}
            style={{
              flex: 1,
              height: 34,
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? colors.inverse : 'transparent',
            }}
          >
            <AppText
              size={14}
              weight={selected ? 'semibold' : 'medium'}
              color={selected ? colors.onInverse : colors.text}
              numberOfLines={1}
            >
              {option.label}
            </AppText>
          </Touchable>
        );
      })}
    </View>
  );
}
