import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LinkIcon } from '@/components/icons';
import { Touchable } from '@/components/Touchable';
import { contactsAvailable } from '@/features/contacts/pickContact';
import { NATIVE_ONLY_NOTE } from '@/features/contacts/types';
import { useTheme } from '@/theme';

interface ContactBadgeProps {
  linked: boolean;
  onLink: () => void;
}

/**
 * Bajo el nombre: el chip "Contacto vinculado" o, si no hay contacto, el botón "Vincular
 * contacto". En web el botón aparece desactivado con una nota discreta.
 */
export function ContactBadge({ linked, onLink }: ContactBadgeProps) {
  const { colors } = useTheme();

  const pill = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: colors.surface,
  } as const;

  if (linked) {
    return (
      <View style={pill} accessible accessibilityLabel="Contacto vinculado">
        <LinkIcon color={colors.accentText} />
        <AppText size={12} weight="medium">
          Contacto vinculado
        </AppText>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Touchable
        onPress={onLink}
        disabled={!contactsAvailable}
        hitSlop={{ top: 9, bottom: 9, left: 8, right: 8 }}
        accessibilityLabel="Vincular contacto"
        accessibilityHint="Elige un contacto de tu agenda para poder escribirle por WhatsApp"
        style={pill}
      >
        <LinkIcon color={colors.accentText} />
        <AppText size={12} weight="semibold" color={colors.accentText}>
          Vincular contacto
        </AppText>
      </Touchable>
      {contactsAvailable ? null : (
        <AppText size={11} secondary>
          {NATIVE_ONLY_NOTE}
        </AppText>
      )}
    </View>
  );
}
