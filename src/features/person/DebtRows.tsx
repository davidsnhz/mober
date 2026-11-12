import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { CheckIcon } from '@/components/icons';
import { SwipeToPayRow } from '@/components/SwipeToPayRow';
import { Touchable } from '@/components/Touchable';
import type { Debt } from '@/db/types';
import { formatShortDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { useTheme } from '@/theme';

const NO_CONCEPT = 'Sin concepto';

interface PendingDebtRowProps {
  debt: Debt;
  now: number;
  isLast: boolean;
  onPaid: () => void;
  onPress: () => void;
}

/** Deuda pendiente: se desliza a la derecha para pagarla y se toca para editarla. */
export function PendingDebtRow({ debt, now, isLast, onPaid, onPress }: PendingDebtRowProps) {
  const { colors } = useTheme();
  const concept = debt.concept ?? NO_CONCEPT;
  const amount = formatMoney(debt.amountCents);
  const date = formatShortDate(debt.createdAt, now);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(160)}
      layout={LinearTransition.duration(220)}
      style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: colors.separator }}
    >
      <SwipeToPayRow
        onPaid={onPaid}
        onPress={onPress}
        accessibilityLabel={`${concept}, ${amount}, ${date}`}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingHorizontal: 16,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <AppText size={16} weight="medium" numberOfLines={1}>
              {concept}
            </AppText>
            <AppText size={13} secondary tabular>
              {date}
            </AppText>
          </View>
          <AppText size={16} weight="semibold" tabular>
            {amount}
          </AppText>
        </View>
      </SwipeToPayRow>
    </Animated.View>
  );
}

interface PaidDebtRowProps {
  debt: Debt;
  now: number;
  isLast: boolean;
  /** Texto bajo el concepto; por defecto "Pagado el 12 oct". */
  detail?: string;
  onPress: () => void;
}

/** Deuda cobrada: check verde, texto en gris y la cantidad tachada. */
export function PaidDebtRow({ debt, now, isLast, detail, onPress }: PaidDebtRowProps) {
  const { colors } = useTheme();
  const concept = debt.concept ?? NO_CONCEPT;
  const amount = formatMoney(debt.amountCents);
  const paidOn = `Pagado el ${formatShortDate(debt.paidAt ?? debt.createdAt, now)}`;
  const subtitle = detail ? `${detail} · ${paidOn}` : paidOn;

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(160)}
      layout={LinearTransition.duration(220)}
    >
      <Touchable
        onPress={onPress}
        pressedScale={1}
        pressedOpacity={0.6}
        accessibilityLabel={`${concept}, ${amount}, ${subtitle}`}
        style={{
          height: 64,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingHorizontal: 16,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.separator,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckIcon size={16} color={colors.accentText} strokeWidth={2.6} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <AppText size={16} weight="medium" secondary numberOfLines={1}>
              {concept}
            </AppText>
            <AppText size={13} secondary tabular numberOfLines={1}>
              {subtitle}
            </AppText>
          </View>
        </View>
        <AppText
          size={16}
          weight="semibold"
          secondary
          tabular
          style={{ textDecorationLine: 'line-through' }}
        >
          {amount}
        </AppText>
      </Touchable>
    </Animated.View>
  );
}
