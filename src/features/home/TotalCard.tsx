import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BigAmount } from '@/components/BigAmount';
import { formatAmount, formatMoney } from '@/lib/money';
import { plural } from '@/lib/text';
import { useAnimatedNumber } from '@/lib/useAnimatedNumber';
import type { Totals } from '@/store/selectors';
import { radius, useTheme } from '@/theme';

function Chip({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.heroChip,
        borderRadius: radius.pill,
        paddingVertical: 6,
        paddingHorizontal: 12,
      }}
    >
      <AppText size={13} weight="medium" color={colors.heroText} tabular>
        {label}
      </AppText>
    </View>
  );
}

/** Tarjeta negra con el total que te deben y el recuento de personas y deudas. */
export function TotalCard({ totals }: { totals: Totals }) {
  const { colors } = useTheme();
  const animatedTotal = useAnimatedNumber(totals.totalCents);

  return (
    <View
      style={{
        backgroundColor: colors.heroCard,
        borderRadius: radius.hero,
        paddingTop: 22,
        paddingHorizontal: 22,
        paddingBottom: 20,
        gap: 4,
      }}
    >
      <AppText size={15} weight="medium" color={colors.heroLabel}>
        Te deben
      </AppText>
      <BigAmount
        value={formatAmount(animatedTotal)}
        size={48}
        color={colors.heroText}
        accessibilityLabel={`Te deben ${formatMoney(totals.totalCents)}`}
      />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <Chip label={plural(totals.peopleCount, 'persona', 'personas')} />
        <Chip label={plural(totals.debtCount, 'deuda', 'deudas')} />
      </View>
    </View>
  );
}
