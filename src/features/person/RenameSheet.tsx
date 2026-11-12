import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { TextField } from '@/components/TextField';
import type { Person } from '@/db/types';
import { cleanText } from '@/lib/text';
import { findPersonByName } from '@/store/selectors';
import { useDataStore } from '@/store/useDataStore';
import { useTheme } from '@/theme';

interface RenameSheetProps {
  visible: boolean;
  person: Person;
  onClose: () => void;
}

/** Hoja para editar el nombre de una persona. */
export function RenameSheet({ visible, person, onClose }: RenameSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Editar nombre">
      {/* El formulario se monta al abrir la hoja, así siempre parte del nombre actual. */}
      {visible ? <RenameForm person={person} onClose={onClose} /> : null}
    </Sheet>
  );
}

function RenameForm({ person, onClose }: { person: Person; onClose: () => void }) {
  const { colors } = useTheme();
  const people = useDataStore((state) => state.people);
  const updatePerson = useDataStore((state) => state.updatePerson);
  const [name, setName] = useState(person.name);

  const cleaned = cleanText(name);
  const duplicate = findPersonByName(people, cleaned);
  const taken = duplicate !== undefined && duplicate.id !== person.id;
  const canSave = cleaned !== '' && !taken;

  const save = () => {
    if (!canSave) return;
    if (cleaned !== person.name) void updatePerson(person.id, { name: cleaned });
    onClose();
  };

  return (
    <View style={{ gap: 12 }}>
      <TextField
        label="Nombre"
        value={name}
        onChangeText={setName}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={60}
        returnKeyType="done"
        onSubmitEditing={save}
        background={colors.surfaceMuted}
        focusedBackground={colors.surface}
      />
      {taken ? (
        <AppText size={13} color={colors.danger} style={{ paddingLeft: 4 }}>
          Ya tienes a otra persona con ese nombre.
        </AppText>
      ) : null}
      <Button label="Guardar" onPress={save} disabled={!canSave} />
    </View>
  );
}
