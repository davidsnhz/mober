// Punto de entrada. La tarea en segundo plano de las notificaciones tiene que definirse antes
// de que arranque la app, para que el botón "Pagado" funcione con la app cerrada.
import './src/features/notifications/backgroundTask';

// eslint-disable-next-line import/first
import 'expo-router/entry';
