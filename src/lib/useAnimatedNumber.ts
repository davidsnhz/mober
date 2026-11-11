import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 450;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Transición del total: cuando cambia el valor, la cifra recorre los intermedios en lugar de
 * saltar. Devuelve siempre enteros (céntimos).
 */
export function useAnimatedNumber(target: number): number {
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    if (from === target) return;

    const start = Date.now();
    let frame = 0;

    const tick = () => {
      const progress = Math.min(1, (Date.now() - start) / DURATION_MS);
      const next = Math.round(from + (target - from) * easeOutCubic(progress));
      current.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}
