import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Sheet } from '@/components/Sheet';
import { formatTime, WEEKDAYS } from '@/lib/dates';
import { hapticTap } from '@/lib/haptics';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTheme } from '@/theme';

/** Días en el orden habitual en España: de lunes a domingo. */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
/** Horas razonables para un aviso: de 7:00 a 23:00. */
const HOURS = Array.from({ length: 17 }, (_, index) => index + 7);

interface DayTimeSheetProps {
  visible: boolean;
  onClose: () => void;
  /** El día solo se elige en los resúmenes semanal y quincenal. */
  showWeekday: boolean;
}

/** Hoja "Día y hora" de los recordatorios. */
export function DayTimeSheet({ visible, onClose, showWeekday }: DayTimeSheetProps) {
  const { colors } = useTheme();
  const weekday = useSettingsStore((state) => state.settings.summaryWeekday);
  const hour = useSettingsStore((state) => state.settings.summaryHour);
  const update = useSettingsStore((state) => state.update);

  return (
    <Sheet visible={visible} onClose={onClose} title={showWeekday ? 'Día y hora' : 'Hora'}>
      <View style={{ gap: 16 }}>
        {showWeekday ? (
          <View style={{ gap: 8 }}>
            <AppText size={13} weight="semibold" secondary>
              Día del resumen
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {WEEKDAY_ORDER.map((day) => (
                <Chip
                  key={day}
                  label={WEEKDAYS[day]}
                  selected={day === weekday}
                  background={colors.surfaceMuted}
                  onPress={() => {
                    hapticTap();
                    void update({ summaryWeekday: day });
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ gap: 8 }}>
          <AppText size={13} weight="semibold" secondary>
            Hora de los avisos
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {HOURS.map((option) => (
              <Chip
                key={option}
                label={formatTime(option, 0)}
                selected={option === hour}
                background={colors.surfaceMuted}
                onPress={() => {
                  hapticTap();
                  void update({ summaryHour: option, summaryMinute: 0 });
                }}
              />
            ))}
          </View>
        </View>

        <Button label="Listo" onPress={onClose} />
      </View>
    </Sheet>
  );
}
