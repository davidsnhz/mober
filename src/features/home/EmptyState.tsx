import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { CheckIcon } from '@/components/icons';
import { Touchable } from '@/components/Touchable';
import { plural } from '@/lib/text';
import { layout, useTheme } from '@/theme';

interface EmptyStateProps {
  /** Deudas ya cobradas; si hay alguna se muestra el enlace al historial. */
  paidCount: number;
  onOpenHistory: () => void;
}

/** Inicio sin deudas pendientes: círculo verde con un tick y el mensaje "Nadie te debe nada". */
export function EmptyState({ paidCount, onOpenHistory }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        // Deja libre el botón fijo y sube el bloque hacia el centro óptico, como en el diseño.
        paddingBottom: layout.buttonHeight + 120,
        gap: 12,
      }}
    >
      <Animated.View
        entering={ZoomIn.duration(320)}
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <CheckIcon size={48} color={colors.onAccent} strokeWidth={3.2} />
      </Animated.View>
      <AppText
        size={26}
        weight="semibold"
        align="center"
        accessibilityRole="header"
        style={{ letterSpacing: -0.52 }}
      >
        Nadie te debe nada
      </AppText>
      <AppText size={15} secondary align="center" style={{ lineHeight: 22.5 }}>
        Cuando pagues algo por alguien, apúntalo aquí y Mober se acordará por ti.
      </AppText>
      {paidCount > 0 ? (
        <Touchable
          onPress={onOpenHistory}
          accessibilityRole="link"
          accessibilityLabel={`Ver historial, ${plural(paidCount, 'cobrada', 'cobradas')}`}
          style={{ marginTop: 4, minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}
        >
          <AppText size={15} weight="semibold" color={colors.accentText} tabular>
            Ver historial · {plural(paidCount, 'cobrada', 'cobradas')}
          </AppText>
        </Touchable>
      ) : null}
    </Animated.View>
  );
}
