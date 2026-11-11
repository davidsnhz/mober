import type { Repository } from './repository';
import { SqliteRepository } from './sqliteRepository';

/** iOS y Android: SQLite siempre. La variante web está en `createRepository.web.ts`. */
export async function createRepository(): Promise<Repository> {
  const repository = new SqliteRepository();
  await repository.init();
  return repository;
}
