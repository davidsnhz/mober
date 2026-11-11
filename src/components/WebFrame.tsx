import type { ReactNode } from 'react';

/** En iOS y Android la app ocupa toda la pantalla; el marco solo existe en web. */
export function WebFrame({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
