import { Platform } from 'react-native';

/** Las notificaciones locales programadas solo existen en la app de iOS y Android. */
export const notificationsAvailable = Platform.OS !== 'web';
