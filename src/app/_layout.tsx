import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { ToastHost } from '@/components/ToastHost';
import { WebFrame } from '@/components/WebFrame';
import { useDataStore } from '@/store/useDataStore';
import { useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const status = useDataStore((state) => state.status);
  const theme = useTheme();
  const { colors, dark } = theme;

  useEffect(() => {
    void useDataStore.getState().bootstrap();
  }, []);

  const ready = (fontsLoaded || fontError !== null) && status !== 'loading';

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  const navigationTheme = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.separator,
        primary: colors.accent,
      },
    };
  }, [dark, colors]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <WebFrame>
            {status === 'error' ? (
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 32,
                  gap: 8,
                  backgroundColor: colors.background,
                }}
              >
                <AppText size={20} weight="semibold" align="center">
                  No se pudieron abrir tus datos
                </AppText>
                <AppText size={15} secondary align="center">
                  Cierra Mober y vuelve a abrirla. Tus deudas siguen guardadas en este dispositivo.
                </AppText>
              </View>
            ) : (
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen
                  name="nueva-deuda"
                  options={{
                    presentation: 'modal',
                    contentStyle: { backgroundColor: colors.modalBackground },
                  }}
                />
              </Stack>
            )}
            <ToastHost />
          </WebFrame>
          <StatusBar style={dark ? 'light' : 'dark'} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
