import { useLocalSearchParams } from 'expo-router';

import { PersonScreen } from '@/features/person/PersonScreen';

export default function Persona() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PersonScreen personId={id} />;
}
