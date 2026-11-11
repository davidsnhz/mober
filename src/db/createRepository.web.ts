import { LocalRepository, type KeyValueStorage } from './localRepository';
import type { Repository } from './repository';

const BACKEND_KEY = 'mober.backend';
const SQLITE_TIMEOUT_MS = 6000;

/** Almacén en memoria para navegadores con localStorage bloqueado (modo privado estricto). */
function memoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

function safeLocalStorage(): KeyValueStorage {
  try {
    const storage = globalThis.localStorage;
    storage.setItem('mober.probe', '1');
    storage.removeItem('mober.probe');
    return storage;
  } catch {
    return memoryStorage();
  }
}

/** SQLite en web necesita aislamiento de origen (COOP/COEP), SharedArrayBuffer y OPFS. */
function sqliteLooksAvailable(): boolean {
  return (
    globalThis.crossOriginIsolated === true &&
    typeof SharedArrayBuffer !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.storage?.getDirectory === 'function'
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('SQLite tardó demasiado en abrir')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

async function openLocal(storage: KeyValueStorage): Promise<Repository> {
  const repository = new LocalRepository(storage);
  await repository.init();
  return repository;
}

/**
 * Web: usa expo-sqlite cuando el navegador lo soporta y, si no, localStorage detrás de la misma
 * interfaz. La elección se recuerda para que los datos no cambien de sitio entre visitas.
 */
export async function createRepository(): Promise<Repository> {
  const storage = safeLocalStorage();
  const remembered = storage.getItem(BACKEND_KEY);

  if (remembered !== 'local' && sqliteLooksAvailable()) {
    try {
      const { SqliteRepository } = await import('./sqliteRepository');
      const repository = new SqliteRepository();
      await withTimeout(repository.init(), SQLITE_TIMEOUT_MS);
      storage.setItem(BACKEND_KEY, 'sqlite');
      return repository;
    } catch (error) {
      console.warn('SQLite no está disponible en este navegador; se usa localStorage.', error);
    }
  }

  storage.setItem(BACKEND_KEY, 'local');
  return openLocal(storage);
}
