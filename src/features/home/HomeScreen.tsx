import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { PlusIcon, SettingsIcon } from '@/components/icons';
import { Logo } from '@/components/Logo';
import { useScreenInsets } from '@/components/Screen';
import { useNow } from '@/lib/useNow';
import { computeTotals, countPaid, summarizePeople } from '@/store/selectors';
import { useDataStore } from '@/store/useDataStore';
import { layout, useTheme } from '@/theme';

import { EmptyState } from './EmptyState';
import { PersonRow } from './PersonRow';
import { TotalCard } from './TotalCard';

export function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useScreenInsets();
  const now = useNow();

  const people = useDataStore((state) => state.people);
  const debts = useDataStore((state) => state.debts);

  const summaries = useMemo(() => summarizePeople(people, debts), [people, debts]);
  const totals = useMemo(() => computeTotals(summaries), [summaries]);
  const paidCount = useMemo(() => countPaid(debts), [debts]);
  const isEmpty = summaries.length === 0;

  const header = (
    <View
      style={{
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Logo />
      <IconButton label="Ajustes" onPress={() => router.push('/ajustes')}>
        <SettingsIcon color={colors.text} knobFill={colors.surface} />
      </IconButton>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isEmpty ? (
        <View style={{ flex: 1, paddingTop: insets.top, paddingHorizontal: layout.screenPadding }}>
          {header}
          <EmptyState paidCount={paidCount} onOpenHistory={() => router.push('/historial')} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top,
            paddingHorizontal: layout.screenPadding,
            paddingBottom: insets.bottom + layout.buttonHeight + 28,
            gap: 20,
          }}
        >
          {header}
          <TotalCard totals={totals} />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingHorizontal: 4,
            }}
          >
            <AppText size={17} weight="semibold" accessibilityRole="header">
              Personas
            </AppText>
            <AppText size={13} secondary>
              Más antiguas primero
            </AppText>
          </View>

          <View
            style={{ backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16 }}
          >
            {summaries.map((summary, index) => (
              <PersonRow
                key={summary.person.id}
                summary={summary}
                now={now}
                index={index}
                isLast={index === summaries.length - 1}
                onPress={() =>
                  router.push({ pathname: '/persona/[id]', params: { id: summary.person.id } })
                }
              />
            ))}
          </View>
        </ScrollView>
      )}

      <View
        style={{
          position: 'absolute',
          left: layout.screenPadding,
          right: layout.screenPadding,
          bottom: insets.bottom,
        }}
      >
        <Button
          label="Apuntar deuda"
          icon={<PlusIcon color={colors.onAccent} />}
          onPress={() => router.push('/nueva-deuda')}
        />
      </View>
    </View>
  );
}
