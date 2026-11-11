import type { ReactNode } from 'react';

import { layout, useTheme } from '@/theme';

import { Touchable } from './Touchable';

interface IconButtonProps {
  /** Obligatoria: los botones de solo icono siempre llevan etiqueta de accesibilidad. */
  label: string;
  onPress: () => void;
  children: ReactNode;
  /** Color de fondo; por defecto, el de las tarjetas. */
  background?: string;
}

/** Botón redondo de 44 pt con un icono. */
export function IconButton({ label, onPress, children, background }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Touchable
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      pressedScale={0.92}
      style={{
        width: layout.touchTarget,
        height: layout.touchTarget,
        borderRadius: layout.touchTarget / 2,
        backgroundColor: background ?? colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </Touchable>
  );
}
