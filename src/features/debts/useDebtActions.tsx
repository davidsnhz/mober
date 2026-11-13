import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';

import { ConfirmSheet, OptionSheet, type SheetOption } from '@/components/Sheet';
import { hapticSuccess, hapticWarning } from '@/lib/haptics';
import { formatMoney } from '@/lib/money';
import { firstName } from '@/lib/text';
import { orphanedPersonId } from '@/store/selectors';
import { useDataStore } from '@/store/useDataStore';
import { showToast } from '@/store/useToastStore';

interface DebtActionsOptions {
  /** Añade "Ver a {nombre}" al menú; se usa en el historial general. */
  linkToPerson?: boolean;
}

interface DebtActions {
  /** Abre el menú de acciones de una deuda. */
  open: (debtId: string) => void;
  /** Hojas del menú y de la confirmación: hay que pintarlas en la pantalla. */
  sheets: ReactNode;
}

type State = { debtId: string; mode: 'menu' | 'confirm' } | null;

/**
 * Menú que aparece al tocar una deuda, pendiente o ya cobrada: editarla, cambiar su estado o
 * borrarla si se apuntó por error. Borrar siempre pide confirmación.
 */
export function useDebtActions({ linkToPerson = false }: DebtActionsOptions = {}): DebtActions {
  const router = useRouter();
  const people = useDataStore((state) => state.people);
  const debts = useDataStore((state) => state.debts);
  const markPaid = useDataStore((state) => state.markPaid);
  const markPending = useDataStore((state) => state.markPending);
  const deleteDebt = useDataStore((state) => state.deleteDebt);
  const [state, setState] = useState<State>(null);

  const debt = state ? debts.find((candidate) => candidate.id === state.debtId) : undefined;
  const person = debt ? people.find((candidate) => candidate.id === debt.personId) : undefined;
  const close = () => setState(null);

  const options: SheetOption[] = [];
  if (debt) {
    const id = debt.id;
    options.push({
      key: 'edit',
      label: 'Editar',
      onPress: () => router.push({ pathname: '/deuda/[id]', params: { id } }),
    });
    if (debt.paidAt === null) {
      options.push({
        key: 'paid',
        label: 'Marcar como pagada',
        onPress: () => {
          hapticSuccess();
          void markPaid([id]);
          showToast({
            message: 'Marcada como pagada',
            actionLabel: 'Deshacer',
            onAction: () => void markPending([id]),
          });
        },
      });
    } else {
      options.push({
        key: 'pending',
        label: 'Volver a pendiente',
        detail: 'Si la marcaste como pagada por error',
        onPress: () => {
          void markPending([id]);
          showToast({ message: 'La deuda vuelve a estar pendiente' });
        },
      });
    }
    if (linkToPerson && person) {
      const personId = person.id;
      options.push({
        key: 'person',
        label: `Ver a ${firstName(person.name)}`,
        onPress: () => router.push({ pathname: '/persona/[id]', params: { id: personId } }),
      });
    }
    options.push({
      key: 'delete',
      label: 'Borrar deuda',
      destructive: true,
      onPress: () => setState({ debtId: id, mode: 'confirm' }),
    });
  }

  const removesPerson = debt ? orphanedPersonId(people, debts, debt.id) !== null : false;
  const confirmMessage =
    removesPerson && person
      ? `Se eliminará del todo y no se podrá recuperar. Como es su única deuda, ${person.name} también se borrará.`
      : 'Se eliminará del todo y no se podrá recuperar.';

  const remove = () => {
    if (!debt) return;
    close();
    hapticWarning();
    void deleteDebt(debt.id);
    showToast({ message: 'Deuda borrada' });
  };

  const title = debt
    ? `${debt.concept ?? 'Sin concepto'} · ${formatMoney(debt.amountCents)}`
    : undefined;

  const sheets = (
    <>
      <OptionSheet
        visible={state?.mode === 'menu' && debt !== undefined}
        onClose={close}
        title={title}
        message={linkToPerson ? person?.name : undefined}
        options={options}
      />
      <ConfirmSheet
        visible={state?.mode === 'confirm' && debt !== undefined}
        title="¿Borrar esta deuda?"
        message={confirmMessage}
        confirmLabel="Borrar deuda"
        destructive
        onConfirm={remove}
        onCancel={close}
      />
    </>
  );

  return { open: (debtId) => setState({ debtId, mode: 'menu' }), sheets };
}
