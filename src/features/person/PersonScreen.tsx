import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { BigAmount } from '@/components/BigAmount';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { BackIcon, MoreIcon } from '@/components/icons';
import { useScreenInsets } from '@/components/Screen';
import { ConfirmSheet, OptionSheet, type SheetOption } from '@/components/Sheet';
import { formatShortDate } from '@/lib/dates';
import { hapticSuccess, hapticWarning } from '@/lib/haptics';
import { formatAmount, formatMoney } from '@/lib/money';
import { plural } from '@/lib/text';
import { useAnimatedNumber } from '@/lib/useAnimatedNumber';
import { useNow } from '@/lib/useNow';
import { selectPersonDebts } from '@/store/selectors';
import { useDataStore } from '@/store/useDataStore';
import { showToast } from '@/store/useToastStore';
import { layout, radius, useTheme } from '@/theme';

import { PaidDebtRow, PendingDebtRow } from './DebtRows';
import { RenameSheet } from './RenameSheet';

type OpenSheet = 'menu' | 'rename' | 'delete' | null;

export function PersonScreen({ personId }: { personId: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useScreenInsets();
  const now = useNow();

  const person = useDataStore((state) => state.people.find((p) => p.id === personId));
  const debts = useDataStore((state) => state.debts);
  const markPaid = useDataStore((state) => state.markPaid);
  const markPending = useDataStore((state) => state.markPending);
  const deletePerson = useDataStore((state) => state.deletePerson);

  const { pending, paid, totalCents } = useMemo(
    () => selectPersonDebts(debts, personId),
    [debts, personId],
  );
  const animatedTotal = useAnimatedNumber(totalCents);
  const [sheet, setSheet] = useState<OpenSheet>(null);

  if (!person) return <Redirect href="/" />;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const pay = (ids: string[], message: string) => {
    hapticSuccess();
    void markPaid(ids);
    showToast({
      message,
      actionLabel: 'Deshacer',
      onAction: () => void markPending(ids),
    });
  };

  const payAll = () => {
    const ids = pending.map((debt) => debt.id);
    if (ids.length === 0) return;
    pay(
      ids,
      ids.length === 1 ? 'Marcada como pagada' : `${ids.length} deudas marcadas como pagadas`,
    );
  };

  const remove = () => {
    setSheet(null);
    hapticWarning();
    goBack();
    void deletePerson(person.id);
    showToast({ message: `${person.name} se ha borrado` });
  };

  const editDebt = (debtId: string) =>
    router.push({ pathname: '/deuda/[id]', params: { id: debtId } });

  const oldest = pending[0];
  const summary = oldest
    ? `${plural(pending.length, 'deuda', 'deudas')} · desde el ${formatShortDate(oldest.createdAt, now)}`
    : paid.length > 0
      ? `Todo cobrado · ${plural(paid.length, 'deuda pagada', 'deudas pagadas')}`
      : 'Sin deudas';

  const menuOptions: SheetOption[] = [
    { key: 'rename', label: 'Editar nombre', onPress: () => setSheet('rename') },
    {
      key: 'delete',
      label: 'Borrar persona',
      destructive: true,
      onPress: () => setSheet('delete'),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingHorizontal: layout.screenPadding,
          paddingBottom: insets.bottom + 88,
          gap: 18,
        }}
      >
        <View
          style={{
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <IconButton label="Volver" onPress={goBack}>
            <BackIcon color={colors.text} />
          </IconButton>
          <IconButton label="Más opciones" onPress={() => setSheet('menu')}>
            <MoreIcon color={colors.text} />
          </IconButton>
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Avatar name={person.name} size={64} strong />
          <AppText
            size={20}
            weight="semibold"
            align="center"
            accessibilityRole="header"
            style={{ marginTop: 8 }}
          >
            {person.name}
          </AppText>
          <BigAmount
            value={formatAmount(animatedTotal)}
            size={48}
            accessibilityLabel={`Te debe ${formatMoney(totalCents)}`}
          />
          <AppText size={14} secondary tabular>
            {summary}
          </AppText>
        </View>

        {pending.length > 0 ? (
          <Animated.View layout={LinearTransition.duration(220)} style={{ gap: 10 }}>
            <Button label="Marcar todo como pagado" variant="outline" onPress={payAll} />
          </Animated.View>
        ) : null}

        {pending.length > 0 ? (
          <Animated.View layout={LinearTransition.duration(220)} style={{ gap: 10 }}>
            <AppText
              size={15}
              weight="semibold"
              accessibilityRole="header"
              style={{ paddingLeft: 4 }}
            >
              Pendiente
            </AppText>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.card,
                overflow: 'hidden',
              }}
            >
              {pending.map((debt, index) => (
                <PendingDebtRow
                  key={debt.id}
                  debt={debt}
                  now={now}
                  isLast={index === pending.length - 1}
                  onPaid={() => pay([debt.id], 'Marcada como pagada')}
                  onPress={() => editDebt(debt.id)}
                />
              ))}
            </View>
            <AppText size={12} secondary align="center">
              Desliza a la derecha para marcar como pagado
            </AppText>
          </Animated.View>
        ) : null}

        {paid.length > 0 ? (
          <Animated.View layout={LinearTransition.duration(220)} style={{ gap: 10 }}>
            <AppText
              size={15}
              weight="semibold"
              accessibilityRole="header"
              style={{ paddingLeft: 4 }}
            >
              Pagado
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
                  isLast={index === paid.length - 1}
                  onPress={() => editDebt(debt.id)}
                />
              ))}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      <OptionSheet
        visible={sheet === 'menu'}
        onClose={() => setSheet(null)}
        title={person.name}
        options={menuOptions}
      />
      <RenameSheet visible={sheet === 'rename'} person={person} onClose={() => setSheet(null)} />
      <ConfirmSheet
        visible={sheet === 'delete'}
        title={`¿Borrar a ${person.name}?`}
        message="Se borrarán también todas sus deudas, pendientes y pagadas. No se puede deshacer."
        confirmLabel="Borrar persona"
        destructive
        onConfirm={remove}
        onCancel={() => setSheet(null)}
      />
    </View>
  );
}
