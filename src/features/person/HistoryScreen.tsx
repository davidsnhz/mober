import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { BackIcon } from '@/components/icons';
import { useScreenInsets } from '@/components/Screen';
import { formatMoney, sumCents } from '@/lib/money';
import { plural } from '@/lib/text';
import { useNow } from '@/lib/useNow';
import { useDataStore } from '@/store/useDataStore';
import { layout, radius, useTheme } from '@/theme';

import { PaidDebtRow } from './DebtRows';

/** Historial: todas las deudas ya cobradas, la más reciente primero. */
export function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useScreenInsets();
  const now = useNow();

  const people = useDataStore((state) => state.people);
  const debts = useDataStore((state) => state.debts);

  const paid = useMemo(
    () =>
      debts
        .filter((debt) => debt.paidAt !== null)
        .sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0)),
    [debts],
  );
  const names = useMemo(() => new Map(people.map((person) => [person.id, person.name])), [people]);
  const total = sumCents(paid.map((debt) => debt.amountCents));

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingHorizontal: layout.screenPadding,
        paddingBottom: insets.bottom + 24,
        gap: 18,
      }}
    >
      <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconButton label="Volver" onPress={goBack}>
          <BackIcon color={colors.text} />
        </IconButton>
        <AppText size={22} weight="semibold" accessibilityRole="header">
          Historial
        </AppText>
      </View>

      {paid.length === 0 ? (
        <AppText size={15} secondary align="center" style={{ marginTop: 48, lineHeight: 22 }}>
          Aquí aparecerán las deudas que marques como pagadas.
        </AppText>
      ) : (
        <View style={{ gap: 8 }}>
          <AppText size={13} weight="semibold" secondary tabular style={{ paddingLeft: 4 }}>
            {plural(paid.length, 'cobrada', 'cobradas')} · {formatMoney(total)}
          </AppText>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.card,
              overflow: 'hidden',
            }}
          >
            {paid.map((debt, index) => (
              <PaidDebtRow
                key={debt.id}
                debt={debt}
                now={now}
                detail={names.get(debt.personId)}
                isLast={index === paid.length - 1}
                onPress={() =>
                  router.push({ pathname: '/persona/[id]', params: { id: debt.personId } })
                }
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
