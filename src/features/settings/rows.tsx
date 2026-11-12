import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ChevronRightIcon } from '@/components/icons';
import { Switch } from '@/components/Switch';
import { Touchable } from '@/components/Touchable';
import { radius, useTheme } from '@/theme';

/** Sección de Ajustes: título pequeño en gris y una tarjeta con las filas. */
export function Section({
  title,
  footnote,
  children,
}: {
  title: string;
  footnote?: string;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      <AppText
        size={13}
        weight="semibold"
        secondary
        accessibilityRole="header"
        style={{ paddingLeft: 4 }}
      >
        {title}
      </AppText>
      {children}
      {footnote ? (
        <AppText size={12} secondary style={{ paddingLeft: 4 }}>
          {footnote}
        </AppText>
      ) : null}
    </View>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        paddingHorizontal: 16,
      }}
    >
      {children}
    </View>
  );
}

interface RowProps {
  label: string;
  detail?: string;
  isLast?: boolean;
  disabled?: boolean;
}

function rowStyle(isLast: boolean, separator: string) {
  return {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: separator,
  } as const;
}

function RowLabel({ label, detail }: { label: string; detail?: string }) {
  return (
    <View style={{ flex: 1, gap: 1, paddingVertical: 6 }}>
      <AppText size={15}>{label}</AppText>
      {detail ? (
        <AppText size={12} secondary>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

/** Fila que abre un selector u otra pantalla: valor actual en gris y una flecha. */
export function LinkRow({
  label,
  detail,
  value,
  valueColor,
  isLast = false,
  disabled = false,
  onPress,
}: RowProps & { value?: string; valueColor?: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      pressedScale={1}
      pressedOpacity={0.5}
      accessibilityLabel={value ? `${label}: ${value}` : label}
      style={rowStyle(isLast, colors.separator)}
    >
      <RowLabel label={label} detail={detail} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {value ? (
          <AppText size={15} color={valueColor ?? colors.textSecondary} tabular>
            {value}
          </AppText>
        ) : null}
        <ChevronRightIcon size={14} color={colors.textSecondary} />
      </View>
    </Touchable>
  );
}

/** Fila con interruptor. */
export function SwitchRow({
  label,
  detail,
  value,
  isLast = false,
  disabled = false,
  onChange,
}: RowProps & { value: boolean; onChange: (value: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={rowStyle(isLast, colors.separator)}>
      <View style={{ flex: 1, opacity: disabled ? 0.4 : 1 }}>
        <RowLabel label={label} detail={detail} />
      </View>
      <Switch label={label} value={value} onChange={onChange} disabled={disabled} />
    </View>
  );
}
