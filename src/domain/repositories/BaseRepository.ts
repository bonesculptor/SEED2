import { SupabaseClient } from '@supabase/supabase-js';

export class RepositoryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export abstract class BaseRepository<T> {
  constructor(protected readonly db: SupabaseClient) {}

  protected handleError(error: unknown, operation: string): never {
    console.error(`Repository error during ${operation}:`, error);
    throw new RepositoryError(
      `Failed to ${operation}`,
      error
    );
  }

  protected ensureUserId(userId: string | undefined): string {
    if (!userId) {
      throw new RepositoryError('User ID is required but was not provided');
    }
    return userId;
  }
}
