import { useLocalSearchParams } from 'expo-router';

import { DebtFormScreen } from '@/features/debts/DebtFormScreen';

export default function EditarDeuda() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DebtFormScreen debtId={id} />;
}
