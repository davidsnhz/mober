import { View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Touchable } from '@/components/Touchable';
import { daysBetween, formatAgo } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { plural } from '@/lib/text';
import type { PersonSummary } from '@/store/selectors';
import { radius, useTheme } from '@/theme';

/** A partir de cuántos días se marca una deuda como antigua. */
const OLD_DEBT_DAYS = 30;

interface PersonRowProps {
  summary: PersonSummary;
  now: number;
  index: number;
  isLast: boolean;
  onPress: () => void;
}

/** Fila de una persona: avatar, nombre, resumen de sus deudas y la suma a la derecha. */
export function PersonRow({ summary, now, index, isLast, onPress }: PersonRowProps) {
  const { colors } = useTheme();
  const { person, pending, totalCents, oldestAt } = summary;

  const onlyDebt = pending.length === 1 ? pending[0] : undefined;
  const what = onlyDebt?.concept ?? plural(pending.length, 'deuda', 'deudas');
  const ago = formatAgo(oldestAt, now);
  const subtitle = `${what} · ${ago}`;
  const isOld = daysBetween(oldestAt, now) >= OLD_DEBT_DAYS;
  const amount = formatMoney(totalCents);

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(280)}
      layout={LinearTransition.duration(220)}
    >
      <Touchable
        onPress={onPress}
        pressedScale={0.99}
        pressedOpacity={0.6}
        accessibilityLabel={`${person.name}, ${amount}, ${subtitle}${isOld ? ', más de 30 días' : ''}`}
        accessibilityHint="Abre el detalle de esta persona"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.separator,
        }}
      >
        <Avatar name={person.name} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <AppText size={16} weight="semibold" numberOfLines={1}>
            {person.name}
          </AppText>
          {/* El concepto se recorta si no cabe; "hace X días" se ve siempre entero. */}
          <View style={{ flexDirection: 'row' }}>
            <AppText size={13} secondary numberOfLines={1} style={{ flexShrink: 1 }}>
              {what}
            </AppText>
            <AppText size={13} secondary numberOfLines={1} style={{ flexShrink: 0, marginLeft: 4 }}>
              · {ago}
            </AppText>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <AppText size={16} weight="semibold" tabular>
            {amount}
          </AppText>
          {isOld ? (
            <View
              style={{
                backgroundColor: colors.inverse,
                borderRadius: radius.pill,
                paddingVertical: 2,
                paddingHorizontal: 8,
              }}
            >
              <AppText size={11} weight="semibold" color={colors.onInverse}>
                +30 días
              </AppText>
            </View>
          ) : null}
        </View>
      </Touchable>
    </Animated.View>
  );
}
