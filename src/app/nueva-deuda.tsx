import { DebtFormScreen } from '@/features/debts/DebtFormScreen';
import { promptForNotificationsOnce } from '@/features/notifications/notifications';

export default function NuevaDeuda() {
  // El permiso de notificaciones se pide al guardar la primera deuda, nunca al abrir la app.
  return <DebtFormScreen onDebtSaved={() => void promptForNotificationsOnce()} />;
}
