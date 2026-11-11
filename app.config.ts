import type { ExpoConfig } from 'expo/config';

const INK = '#0B0B0C';
const GREEN = '#00C26F';

const config: ExpoConfig = {
  name: 'Mober',
  slug: 'mober',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'mober',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#F4F4F2',
  primaryColor: GREEN,
  ios: {
    bundleIdentifier: 'com.mober.app',
    supportsTablet: false,
    infoPlist: {
      CFBundleDevelopmentRegion: 'es',
      CFBundleLocalizations: ['es'],
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationQueriesSchemes: ['whatsapp'],
      NSContactsUsageDescription:
        'Mober usa solo el contacto que elijas para guardar su teléfono y poder recordarle la deuda por WhatsApp. Nunca lee tu agenda completa.',
      NSUserNotificationsUsageDescription:
        'Mober te avisa de lo que te deben con recordatorios programados en tu móvil.',
    },
  },
  android: {
    package: 'com.mober.app',
    adaptiveIcon: {
      backgroundColor: INK,
      foregroundImage: './assets/adaptive-icon.png',
      monochromeImage: './assets/adaptive-icon-monochrome.png',
    },
    permissions: ['POST_NOTIFICATIONS', 'VIBRATE', 'RECEIVE_BOOT_COMPLETED'],
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
    lang: 'es',
    name: 'Mober',
    shortName: 'Mober',
    description: 'Lo que te deben, recordado.',
    themeColor: INK,
    backgroundColor: '#F4F4F2',
  },
  plugins: [
    [
      'expo-router',
      {
        // Aislamiento de origen: lo necesita expo-sqlite en web (SharedArrayBuffer + OPFS).
        headers: {
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      },
    ],
    'expo-sqlite',
    'expo-font',
    'expo-sharing',
    [
      'expo-splash-screen',
      {
        backgroundColor: INK,
        image: './assets/splash-icon.png',
        imageWidth: 160,
        dark: { backgroundColor: '#000000', image: './assets/splash-icon.png' },
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: GREEN,
        defaultChannel: 'recordatorios',
        enableRemoteNotifications: false,
      },
    ],
    [
      'expo-contacts',
      {
        contactsPermission:
          'Mober usa solo el contacto que elijas para guardar su teléfono y poder recordarle la deuda por WhatsApp. Nunca lee tu agenda completa.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
