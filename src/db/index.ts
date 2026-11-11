import { createRepository } from './createRepository';
import type { Repository } from './repository';

export type { Repository } from './repository';
export type { Debt, DebtPatch, Person, PersonPatch, Snapshot } from './types';

let repositoryPromise: Promise<Repository> | null = null;

/** Repositorio único de la app; se abre la primera vez que se pide. */
export function getRepository(): Promise<Repository> {
  repositoryPromise ??= createRepository().catch((error: unknown) => {
    repositoryPromise = null;
    throw error;
  });
  return repositoryPromise;
}
