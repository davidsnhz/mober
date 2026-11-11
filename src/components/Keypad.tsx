import { View } from 'react-native';

import { hapticTap } from '@/lib/haptics';
import type { KeypadKey } from '@/lib/money';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { BackspaceIcon } from './icons';
import { Touchable } from './Touchable';

const ROWS: readonly (readonly KeypadKey[])[] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [',', '0', 'del'],
];

const KEY_LABELS: Partial<Record<KeypadKey, string>> = { ',': 'Coma', del: 'Borrar' };

interface KeypadProps {
  onKey: (key: KeypadKey) => void;
}

/** Teclado numérico propio: 1-9, coma, 0 y borrar. */
export function Keypad({ onKey }: KeypadProps) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      {ROWS.map((row) => (
        <View key={row.join('')} style={{ flexDirection: 'row', gap: 4 }}>
          {row.map((key) => (
            <Touchable
              key={key}
              accessibilityLabel={KEY_LABELS[key] ?? key}
              pressedScale={0.9}
              pressedOpacity={0.4}
              onPress={() => {
                hapticTap();
                onKey(key);
              }}
              style={{ flex: 1, height: 52, alignItems: 'center', justifyContent: 'center' }}
            >
              {key === 'del' ? (
                <BackspaceIcon color={colors.text} />
              ) : (
                <AppText size={24} weight="medium" tabular maxFontSizeMultiplier={1}>
                  {key}
                </AppText>
              )}
            </Touchable>
          ))}
        </View>
      ))}
    </View>
  );
}
