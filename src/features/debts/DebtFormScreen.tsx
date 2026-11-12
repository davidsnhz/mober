import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type TextInputInstance,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { BigAmount } from '@/components/BigAmount';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import { CloseIcon } from '@/components/icons';
import { Keypad } from '@/components/Keypad';
import { useScreenInsets } from '@/components/Screen';
import { ConfirmSheet } from '@/components/Sheet';
import { TextField } from '@/components/TextField';
import { hapticSuccess, hapticWarning } from '@/lib/haptics';
import {
  applyKeypadKey,
  centsToInput,
  formatInput,
  formatMoney,
  inputToCents,
  type KeypadKey,
} from '@/lib/money';
import { cleanText } from '@/lib/text';
import { findPersonByName, suggestPeople } from '@/store/selectors';
import { useDataStore } from '@/store/useDataStore';
import { showToast } from '@/store/useToastStore';
import { layout, useTheme } from '@/theme';

interface DebtFormScreenProps {
  /** Si se indica, el formulario edita esa deuda en lugar de crear una nueva. */
  debtId?: string;
  /** Se llama tras guardar una deuda nueva. */
  onDebtSaved?: () => void;
}

type Field = 'who' | 'why';

/** Modal "Nueva deuda" (y edición de una deuda existente). */
export function DebtFormScreen({ debtId, onDebtSaved }: DebtFormScreenProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useScreenInsets();

  const people = useDataStore((state) => state.people);
  const debts = useDataStore((state) => state.debts);
  const addDebt = useDataStore((state) => state.addDebt);
  const updateDebt = useDataStore((state) => state.updateDebt);
  const deleteDebt = useDataStore((state) => state.deleteDebt);
  const markPending = useDataStore((state) => state.markPending);

  const editing = useMemo(
    () => (debtId ? debts.find((debt) => debt.id === debtId) : undefined),
    [debtId, debts],
  );
  const editingPerson = editing
    ? people.find((person) => person.id === editing.personId)
    : undefined;
  const isEdit = debtId !== undefined;

  const [amountInput, setAmountInput] = useState(() =>
    editing ? centsToInput(editing.amountCents) : '',
  );
  const [name, setName] = useState(editingPerson?.name ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [concept, setConcept] = useState(editing?.concept ?? '');
  const [focused, setFocused] = useState<Field | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const whoRef = useRef<TextInputInstance>(null);
  const whyRef = useRef<TextInputInstance>(null);

  const amountCents = inputToCents(amountInput);
  const suggestions = useMemo(
    () => (isEdit ? [] : suggestPeople(people, debts, name, 3)),
    [isEdit, people, debts, name],
  );
  const exactMatch = useMemo(() => findPersonByName(people, name), [people, name]);
  const activePersonId = selectedId ?? exactMatch?.id ?? null;
  const willCreatePerson = !isEdit && activePersonId === null && cleanText(name) !== '';
  const canSave = !saving && amountCents > 0 && (isEdit || cleanText(name) !== '');

  const close = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const onKey = (key: KeypadKey) => setAmountInput((current) => applyKeypadKey(current, key));

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (editing) {
        const cleaned = cleanText(concept);
        await updateDebt(editing.id, { amountCents, concept: cleaned === '' ? null : cleaned });
        hapticSuccess();
        close();
        return;
      }
      await addDebt({
        personId: activePersonId ?? undefined,
        personName: name,
        amountCents,
        concept,
      });
      hapticSuccess();
      close();
      onDebtSaved?.();
    } catch (error) {
      console.error('No se pudo guardar la deuda', error);
      showToast({ message: 'No se pudo guardar. Inténtalo de nuevo.' });
      setSaving(false);
    }
  };

  const remove = () => {
    if (!editing) return;
    setConfirmingDelete(false);
    hapticWarning();
    void deleteDebt(editing.id);
    close();
    showToast({ message: 'Deuda borrada' });
  };

  if (isEdit && !editing) {
    // La deuda ya no existe (por ejemplo, se borró desde otra pantalla).
    return (
      <View style={{ flex: 1, backgroundColor: colors.modalBackground, paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: layout.screenPadding }}>
          <IconButton label="Cerrar" onPress={close} background={colors.modalControl}>
            <CloseIcon color={colors.text} />
          </IconButton>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      style={{ flex: 1, backgroundColor: colors.modalBackground }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 20 : insets.top,
          paddingHorizontal: layout.screenPadding,
          paddingBottom: 16,
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
          <IconButton label="Cerrar" onPress={close} background={colors.modalControl}>
            <CloseIcon color={colors.text} />
          </IconButton>
          <AppText size={17} weight="semibold" accessibilityRole="header">
            {isEdit ? 'Editar deuda' : 'Nueva deuda'}
          </AppText>
          <View style={{ width: 44, height: 44 }} />
        </View>

        <Pressable
          onPress={() => Keyboard.dismiss()}
          accessibilityRole="button"
          accessibilityLabel={`Cantidad: ${formatMoney(amountCents)}. Toca para usar el teclado numérico`}
          style={{ marginTop: 20, alignItems: 'center', gap: 2 }}
        >
          <AppText size={15} secondary>
            ¿Cuánto te deben?
          </AppText>
          <BigAmount value={formatInput(amountInput)} size={56} />
        </Pressable>

        <View style={{ marginTop: 24, gap: 16 }}>
          {isEdit ? (
            <View style={{ gap: 6 }}>
              <AppText size={13} weight="semibold" secondary style={{ paddingLeft: 4 }}>
                ¿Quién?
              </AppText>
              <View
                style={{
                  minHeight: 52,
                  borderRadius: 14,
                  backgroundColor: colors.modalControl,
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                }}
              >
                <AppText size={16} secondary>
                  {editingPerson?.name ?? ''}
                </AppText>
              </View>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <TextField
                ref={whoRef}
                label="¿Quién?"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setSelectedId(null);
                }}
                onFocus={() => setFocused('who')}
                onBlur={() => setFocused((field) => (field === 'who' ? null : field))}
                placeholder="Nombre"
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="off"
                returnKeyType="next"
                maxLength={60}
                submitBehavior="submit"
                onSubmitEditing={() => whyRef.current?.focus()}
              />
              <ScrollView
                horizontal
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                style={{ marginVertical: -4 }}
              >
                {suggestions.map((person) => (
                  <Chip
                    key={person.id}
                    label={person.name}
                    selected={person.id === activePersonId}
                    onPress={() => {
                      setSelectedId(person.id);
                      setName(person.name);
                    }}
                  />
                ))}
                <Chip
                  label="+ Nueva"
                  accessibilityLabel="Nueva persona"
                  dashed
                  selected={willCreatePerson}
                  onPress={() => {
                    if (activePersonId !== null) {
                      setSelectedId(null);
                      setName('');
                    }
                    whoRef.current?.focus();
                  }}
                />
              </ScrollView>
            </View>
          )}

          <TextField
            ref={whyRef}
            label="¿Por qué? · opcional"
            value={concept}
            onChangeText={setConcept}
            onFocus={() => setFocused('why')}
            onBlur={() => setFocused((field) => (field === 'why' ? null : field))}
            placeholder="Cena, entradas, taxi…"
            autoCapitalize="sentences"
            returnKeyType="done"
            maxLength={80}
            onSubmitEditing={() => Keyboard.dismiss()}
          />

          {editing && editing.paidAt !== null ? (
            <Button
              label="Volver a pendiente"
              variant="outline"
              height={48}
              onPress={() => {
                void markPending([editing.id]);
                close();
                showToast({ message: 'La deuda vuelve a estar pendiente' });
              }}
            />
          ) : null}
          {isEdit ? (
            <Button
              label="Borrar deuda"
              variant="danger"
              height={44}
              onPress={() => setConfirmingDelete(true)}
            />
          ) : null}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: layout.screenPadding,
          paddingBottom: focused === null ? Math.max(insets.bottom - 10, 16) : 12,
          gap: 12,
        }}
      >
        <Button
          label="Guardar"
          onPress={() => void save()}
          disabled={!canSave}
          accessibilityHint={isEdit ? 'Guarda los cambios' : 'Guarda la deuda'}
        />
        {focused === null ? <Keypad onKey={onKey} /> : null}
      </View>

      <ConfirmSheet
        visible={confirmingDelete}
        title="¿Borrar esta deuda?"
        message="Se eliminará del todo y no se podrá recuperar."
        confirmLabel="Borrar deuda"
        destructive
        onConfirm={remove}
        onCancel={() => setConfirmingDelete(false)}
      />
    </KeyboardAvoidingView>
  );
}
