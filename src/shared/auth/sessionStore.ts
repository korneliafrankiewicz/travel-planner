import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createSafeJsonStorage } from '@/shared/store/safeStorage';
import { usePersistHydrated } from '@/shared/store/usePersistHydrated';

import { authService } from './authService';
import { clearToken, loadToken, saveToken } from './tokenStorage';
import { AuthError, type Credentials, type SignUpInput, type User } from './types';

export type SessionStatus =
  // The saved session has not been checked yet (the app has just started).
  | 'loading'
  | 'signedOut'
  | 'signedIn';

type SessionState = {
  status: SessionStatus;
  user: User | null;
  // Checks the saved session when the app starts. Call it once, after the store was hydrated.
  restore: () => Promise<void>;
  // These reject with an AuthError when the service refuses or cannot be reached.
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const userSchema = z.object({ id: z.string().min(1), name: z.string(), email: z.string() });

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      status: 'loading',
      user: null,

      restore: async () => {
        const token = await loadToken();
        if (token === null) {
          set({ status: 'signedOut', user: null });
          return;
        }
        try {
          const user = await authService.getUser(token);
          set({ status: 'signedIn', user });
        } catch (error) {
          if (error instanceof AuthError && error.code === 'invalidSession') {
            // The server no longer accepts this token, so it is of no use.
            await clearToken();
            set({ status: 'signedOut', user: null });
            return;
          }
          // Offline, or the service is down. A traveller must still be able to open the app,
          // so a user that was saved on this device stays signed in. The token is kept and is
          // checked again at the next start.
          set(get().user !== null ? { status: 'signedIn' } : { status: 'signedOut' });
        }
      },

      signIn: async (credentials) => {
        const { token, user } = await authService.signIn(credentials);
        await saveToken(token);
        set({ status: 'signedIn', user });
      },

      signUp: async (input) => {
        const { token, user } = await authService.signUp(input);
        await saveToken(token);
        set({ status: 'signedIn', user });
      },

      signOut: async () => {
        const token = await loadToken();
        if (token !== null) {
          try {
            await authService.signOut(token);
          } catch {
            // The user is signed out on this device even if the server could not be told.
          }
        }
        await clearToken();
        set({ status: 'signedOut', user: null });
      },
    }),
    {
      name: 'session',
      version: 1,
      storage: createSafeJsonStorage<{ user: User | null }>(),
      // Only the user is saved (name and email, no token), so the app can start offline. The
      // token itself lives in secure storage.
      partialize: ({ user }) => ({ user }),
      merge: (persisted, current) => {
        const parsed = userSchema.nullable().safeParse((persisted as { user?: unknown } | undefined)?.user);
        return { ...current, user: parsed.success ? parsed.data : null };
      },
    },
  ),
);

export const useSessionStatus = (): SessionStatus => useSessionStore((state) => state.status);

export const useCurrentUser = (): User | null => useSessionStore((state) => state.user);

// True once the saved user has been read from storage.
export const useSessionHydrated = (): boolean => usePersistHydrated(useSessionStore.persist);
