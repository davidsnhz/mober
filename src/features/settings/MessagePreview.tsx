import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { buildReminderMessage } from '@/features/whatsapp/templates';
import type { MessageTone } from '@/store/settings';
import { palette, useTheme } from '@/theme';

/** Datos de ejemplo de la vista previa, los mismos del diseño. */
const SAMPLE = {
  personName: 'Pedro',
  debts: [{ amountCents: 2000, concept: 'La cena del sábado' }],
};

interface MessagePreviewProps {
  tone: MessageTone;
  customTemplate: string;
}

/** Vista previa del mensaje en una burbuja verde clara, como se verá en WhatsApp. */
export function MessagePreview({ tone, customTemplate }: MessagePreviewProps) {
  const { colors, dark } = useTheme();
  const message = buildReminderMessage({ ...SAMPLE, tone, customTemplate });

  return (
    <View
      accessible
      accessibilityLabel={`Vista previa del mensaje: ${message}`}
      style={{
        alignSelf: 'flex-end',
        maxWidth: 270,
        backgroundColor: colors.accentSoft,
        borderRadius: 16,
        borderBottomRightRadius: 4,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }}
    >
      <AppText size={14} color={dark ? palette.white : palette.ink} style={{ lineHeight: 20.3 }}>
        {message}
      </AppText>
    </View>
  );
}
