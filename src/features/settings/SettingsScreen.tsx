import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { BackIcon } from '@/components/icons';
import { useScreenInsets } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { OptionSheet } from '@/components/Sheet';
import { NATIVE_ONLY_NOTE } from '@/features/contacts/types';
import { notificationsAvailable } from '@/features/notifications/availability';
import { PRESET_TONES, TONE_PRESETS, type PresetTone } from '@/features/whatsapp/templates';
import { formatTime, WEEKDAYS } from '@/lib/dates';
import {
  FREQUENCY_LABELS,
  THEME_LABELS,
  type SummaryFrequency,
  type ThemePreference,
} from '@/store/settings';
import { useDataStore } from '@/store/useDataStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { showToast } from '@/store/useToastStore';
import { layout, radius, useTheme } from '@/theme';

import { DayTimeSheet } from './DayTimeSheet';
import { exportBackup } from './exportBackup';
import { MessagePreview } from './MessagePreview';
import { Card, LinkRow, Section, SwitchRow } from './rows';

type OpenSheet = 'frequency' | 'dayTime' | 'theme' | null;

const FREQUENCIES: readonly SummaryFrequency[] = ['every3days', 'weekly', 'biweekly', 'never'];
const THEMES: readonly ThemePreference[] = ['auto', 'light', 'dark'];
const TONE_OPTIONS = PRESET_TONES.map((key) => ({ key, label: TONE_PRESETS[key].label }));

export function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useScreenInsets();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);
  const [sheet, setSheet] = useState<OpenSheet>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const usesWeekday =
    settings.summaryFrequency === 'weekly' || settings.summaryFrequency === 'biweekly';
  const time = formatTime(settings.summaryHour, settings.summaryMinute);
  const dayTimeLabel = usesWeekday ? `${WEEKDAYS[settings.summaryWeekday] ?? ''}, ${time}` : time;
  const remindersOff = settings.summaryFrequency === 'never' && !settings.ageAlerts;
  const activeTone: PresetTone | null =
    settings.messageTone === 'personalizada' ? null : settings.messageTone;

  const onExport = async () => {
    try {
      const shared = await exportBackup(useDataStore.getState().snapshot());
      if (!shared) showToast({ message: 'Este dispositivo no permite compartir archivos' });
    } catch (error) {
      console.error('No se pudo exportar la copia', error);
      showToast({ message: 'No se pudo exportar la copia' });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
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
            Ajustes
          </AppText>
        </View>

        <Section
          title="Recordatorios"
          footnote={notificationsAvailable ? undefined : NATIVE_ONLY_NOTE}
        >
          <Card>
            <LinkRow
              label="Resumen"
              value={FREQUENCY_LABELS[settings.summaryFrequency]}
              disabled={!notificationsAvailable}
              onPress={() => setSheet('frequency')}
            />
            <LinkRow
              label="Día y hora"
              value={dayTimeLabel}
              disabled={!notificationsAvailable || remindersOff}
              onPress={() => setSheet('dayTime')}
            />
            <SwitchRow
              label="Avisos a los 7 y 30 días"
              value={settings.ageAlerts}
              disabled={!notificationsAvailable}
              onChange={(ageAlerts) => void update({ ageAlerts })}
            />
            <SwitchRow
              label="Ocultar cantidades en avisos"
              value={settings.hideAmounts}
              disabled={!notificationsAvailable}
              isLast
              onChange={(hideAmounts) => void update({ hideAmounts })}
            />
          </Card>
        </Section>

        <Section title="Mensaje de WhatsApp">
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.card,
              paddingTop: 12,
              paddingHorizontal: 16,
              gap: 12,
            }}
          >
            <Segmented
              options={TONE_OPTIONS}
              value={activeTone}
              onChange={(messageTone) => void update({ messageTone })}
            />
            <MessagePreview tone={settings.messageTone} customTemplate={settings.customTemplate} />
            <View style={{ borderTopWidth: 1, borderTopColor: colors.separator }}>
              <LinkRow
                label="Personalizar plantilla"
                detail="Usa {nombre}, {cantidad} y {concepto}"
                value={settings.messageTone === 'personalizada' ? 'Activa' : undefined}
                valueColor={colors.accentText}
                isLast
                onPress={() => router.push('/ajustes/plantilla')}
              />
            </View>
          </View>
        </Section>

        <Section title="General">
          <Card>
            <LinkRow
              label="Tema"
              value={THEME_LABELS[settings.theme]}
              onPress={() => setSheet('theme')}
            />
            <LinkRow label="Exportar copia" isLast onPress={() => void onExport()} />
          </Card>
        </Section>
      </ScrollView>

      <OptionSheet
        visible={sheet === 'frequency'}
        onClose={() => setSheet(null)}
        title="Resumen de lo que te deben"
        selectedKey={settings.summaryFrequency}
        options={FREQUENCIES.map((key) => ({
          key,
          label: FREQUENCY_LABELS[key],
          onPress: () => void update({ summaryFrequency: key }),
        }))}
      />
      <OptionSheet
        visible={sheet === 'theme'}
        onClose={() => setSheet(null)}
        title="Tema"
        selectedKey={settings.theme}
        options={THEMES.map((key) => ({
          key,
          label: THEME_LABELS[key],
          onPress: () => void update({ theme: key }),
        }))}
      />
      <DayTimeSheet
        visible={sheet === 'dayTime'}
        onClose={() => setSheet(null)}
        showWeekday={usesWeekday}
      />
    </View>
  );
}
