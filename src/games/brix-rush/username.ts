import { isValidUsername } from '@/utils/localIdentity';

/** Brix Rush never accepts a separate or fallback player name. */
export function resolveBrixUsername(username: string | null | undefined): string | null {
  return username && isValidUsername(username) ? username : null;
}