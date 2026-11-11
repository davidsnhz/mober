import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Hora actual para textos como "hace 12 días". Se refresca cada minuto y al volver a la app,
 * de modo que la pantalla no se queda con la fecha de cuando se abrió.
 */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const interval = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return now;
}
