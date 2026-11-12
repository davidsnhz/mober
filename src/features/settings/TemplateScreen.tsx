import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import { BackIcon } from '@/components/icons';
import { useScreenInsets } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { editableTemplate, TEMPLATE_VARIABLES } from '@/features/whatsapp/templates';
import { useSettingsStore } from '@/store/useSettingsStore';
import { showToast } from '@/store/useToastStore';
import { layout, useTheme } from '@/theme';

import { MessagePreview } from './MessagePreview';

/** "Personalizar plantilla": edita el mensaje de WhatsApp con sus variables. */
export function TemplateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useScreenInsets();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  const [text, setText] = useState(() =>
    editableTemplate(settings.messageTone, settings.customTemplate),
  );
  const isCustom = settings.messageTone === 'personalizada';
  const canSave = text.trim() !== '';

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/ajustes');
  };

  const save = () => {
    if (!canSave) return;
    void update({ customTemplate: text.trim(), messageTone: 'personalizada' });
    showToast({ message: 'Plantilla guardada' });
    goBack();
  };

  const reset = () => {
    void update({ messageTone: 'amable' });
    showToast({ message: 'Vuelves a usar el tono Amable' });
    goBack();
  };

  const insert = (variable: string) =>
    setText((current) => (current === '' || current.endsWith(' ') ? '' : `${current} `) + variable);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingHorizontal: layout.screenPadding,
          paddingBottom: insets.bottom + 24,
          gap: 18,
        }}
      >
        <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton label="Volver" onPress={goBack}>
            <BackIcon color={colors.text} />
          </IconButton>
          <AppText size={22} weight="semibold" accessibilityRole="header">
            Plantilla
          </AppText>
        </View>

        <AppText size={15} secondary style={{ lineHeight: 22 }}>
          Escribe el mensaje a tu manera. Mober cambia las variables por los datos de cada persona y
          nunca lo envía solo: siempre lo revisas tú en WhatsApp.
        </AppText>

        <View style={{ gap: 10 }}>
          <TextField
            label="Mensaje"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={400}
            autoCapitalize="sentences"
            background={colors.surface}
            focusedBackground={colors.surface}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TEMPLATE_VARIABLES.map((variable) => (
              <Chip
                key={variable}
                label={variable}
                accessibilityLabel={`Insertar ${variable}`}
                background={colors.surface}
                onPress={() => insert(variable)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <AppText size={13} weight="semibold" secondary style={{ paddingLeft: 4 }}>
            Vista previa
          </AppText>
          <MessagePreview tone="personalizada" customTemplate={text} />
        </View>

        <View style={{ gap: 8 }}>
          <Button label="Guardar plantilla" onPress={save} disabled={!canSave} />
          {isCustom ? (
            <Button label="Volver a los tonos de Mober" variant="ghost" onPress={reset} />
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
