import { useEffect, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { layout, palette, useTheme } from '@/theme';

/**
 * Web: en escritorio la app se centra en una columna de 430 px sobre gris niebla; en el móvil
 * ocupa toda la pantalla y el fondo de la página acompaña al tema (se ve al hacer rebote).
 */
export function WebFrame({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const framed = width > layout.maxWebWidth;
  const pageColor = framed ? palette.fog : colors.background;

  useEffect(() => {
    document.documentElement.style.backgroundColor = pageColor;
    document.body.style.backgroundColor = pageColor;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', framed ? palette.fog : colors.background);
  }, [pageColor, framed, colors.background]);

  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: pageColor }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: layout.maxWebWidth,
          backgroundColor: colors.background,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}
