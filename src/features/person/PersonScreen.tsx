import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { BigAmount } from '@/components/BigAmount';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { BackIcon, ChatIcon, MoreIcon } from '@/components/icons';
import { useScreenInsets } from '@/components/Screen';
import { ConfirmSheet, OptionSheet, type SheetOption } from '@/components/Sheet';
import { contactsAvailable, pickContact } from '@/features/contacts/pickContact';
import { NATIVE_ONLY_NOTE } from '@/features/contacts/types';
import { openWhatsApp } from '@/features/whatsapp/openWhatsApp';
import { buildReminderMessage } from '@/features/whatsapp/templates';
import { formatShortDate } from '@/lib/dates';
import { hapticSuccess, hapticWarning } from '@/lib/haptics';
import { formatAmount, formatMoney } from '@/lib/money';
import { formatPhone } from '@/lib/phone';
import { plural } from '@/lib/text';
import { useAnimatedNumber } from '@/lib/useAnimatedNumber';
import { useNow } from '@/lib/useNow';
import { selectPersonDebts } from '@/store/selectors';
import { useDataStore } from '@/store/useDataStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { showToast } from '@/store/useToastStore';
import { layout, radius, useTheme } from '@/theme';

import { ContactBadge } from './ContactBadge';
import { PaidDebtRow, PendingDebtRow } from './DebtRows';
import { RenameSheet } from './RenameSheet';

type OpenSheet = 'menu' | 'rename' | 'delete' | 'noPhone' | 'phones' | null;

/** Al cerrar una hoja en iOS hay que esperar a que termine antes de abrir otra vista nativa. */
const AFTER_SHEET_MS = Platform.OS === 'ios' ? 350 : 0;

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
  const updatePerson = useDataStore((state) => state.updatePerson);
  const messageTone = useSettingsStore((state) => state.settings.messageTone);
  const customTemplate = useSettingsStore((state) => state.settings.customTemplate);

  const { pending, paid, totalCents } = useMemo(
    () => selectPersonDebts(debts, personId),
    [debts, personId],
  );
  const animatedTotal = useAnimatedNumber(totalCents);
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [phoneChoices, setPhoneChoices] = useState<{ contactId: string; phones: string[] }>({
    contactId: '',
    phones: [],
  });

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

  const saveContact = (contactId: string, phone: string) => {
    void updatePerson(person.id, { contactId, phone });
    showToast({ message: 'Contacto vinculado' });
  };

  const linkContact = async () => {
    const result = await pickContact();
    if (result.status === 'cancelled') return;
    if (result.status === 'unavailable') {
      showToast({ message: NATIVE_ONLY_NOTE });
      return;
    }
    if (result.status === 'denied') {
      showToast({ message: 'Mober necesita permiso para leer el contacto que elijas' });
      return;
    }
    if (result.status === 'error') {
      showToast({ message: 'No se pudo abrir tu agenda. Inténtalo de nuevo.' });
      return;
    }
    const [first, ...others] = result.phones;
    if (first === undefined) {
      showToast({ message: 'Ese contacto no tiene un teléfono válido' });
    } else if (others.length === 0) {
      saveContact(result.contactId, first);
    } else {
      setPhoneChoices({ contactId: result.contactId, phones: result.phones });
      setSheet('phones');
    }
  };

  /** Abre el selector de contactos cuando la hoja que lo lanzó ya se ha cerrado. */
  const linkContactAfterSheet = () => {
    setTimeout(() => void linkContact(), AFTER_SHEET_MS);
  };

  const unlinkContact = () => {
    void updatePerson(person.id, { contactId: null, phone: null });
    showToast({ message: 'Contacto desvinculado' });
  };

  const sendReminder = async (phone: string | null) => {
    const message = buildReminderMessage({
      personName: person.name,
      debts: pending,
      tone: messageTone,
      customTemplate,
    });
    const opened = await openWhatsApp(phone, message);
    if (!opened) showToast({ message: 'No se pudo abrir WhatsApp' });
  };

  const remind = () => {
    if (person.phone) void sendReminder(person.phone);
    else setSheet('noPhone');
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
      key: 'contact',
      label: person.phone ? 'Cambiar contacto' : 'Vincular contacto',
      detail: contactsAvailable
        ? person.phone
          ? formatPhone(person.phone)
          : undefined
        : NATIVE_ONLY_NOTE,
      disabled: !contactsAvailable,
      onPress: linkContactAfterSheet,
    },
    ...(person.phone ? [{ key: 'unlink', label: 'Quitar contacto', onPress: unlinkContact }] : []),
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
          <ContactBadge linked={person.phone !== null} onLink={() => void linkContact()} />
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
            <Button
              label="Recordar por WhatsApp"
              icon={<ChatIcon color={colors.onAccent} />}
              onPress={remind}
              accessibilityHint="Abre WhatsApp con el mensaje escrito, sin enviarlo"
            />
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
      <OptionSheet
        visible={sheet === 'noPhone'}
        onClose={() => setSheet(null)}
        title={`${person.name} no tiene teléfono`}
        message="Vincula un contacto para abrir su chat directamente, o elige el chat tú en WhatsApp."
        options={[
          {
            key: 'link',
            label: 'Vincular contacto',
            detail: contactsAvailable ? undefined : NATIVE_ONLY_NOTE,
            disabled: !contactsAvailable,
            onPress: linkContactAfterSheet,
          },
          {
            key: 'choose',
            label: 'Elegir el chat en WhatsApp',
            onPress: () => void sendReminder(null),
          },
        ]}
      />
      <OptionSheet
        visible={sheet === 'phones'}
        onClose={() => setSheet(null)}
        title="¿Qué teléfono usa en WhatsApp?"
        options={phoneChoices.phones.map((phone) => ({
          key: phone,
          label: formatPhone(phone),
          onPress: () => saveContact(phoneChoices.contactId, phone),
        }))}
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
