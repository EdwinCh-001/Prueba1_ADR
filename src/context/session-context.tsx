import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getEmployeeCode } from '../repositories/profile-repository';
import {
  registerWithEmail,
  sendPasswordReset,
  signInWithEmail,
  signOut as signOutFromFirebase,
} from '../services/auth-service';
import { auth } from '../services/firebase';
import type { LoginForm, PasswordResetForm, RegisterForm, Session } from '../types/domain';

interface SessionContextValue {
  session: Session | null;
  isLoading: boolean;
  authStateError: string | null;
  signIn: (credentials: LoginForm) => Promise<void>;
  register: (credentials: RegisterForm) => Promise<void>;
  resetPassword: (credentials: PasswordResetForm) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: React.PropsWithChildren): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(auth !== null);
  const [authStateError, setAuthStateError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      return;
    }

    let active = true;
    let authChangeId = 0;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        const currentChangeId = ++authChangeId;
        if (!user?.emailVerified) {
          if (active && currentChangeId === authChangeId) {
            setSession(null);
            setAuthStateError(null);
            setIsLoading(false);
          }
          return;
        }

        try {
          const employeeCode = await getEmployeeCode(user.uid, user.displayName || user.uid);
          if (active && currentChangeId === authChangeId) {
            setSession({ employeeCode, isActive: true });
            setAuthStateError(null);
            setIsLoading(false);
          }
        } catch {
          if (active && currentChangeId === authChangeId) {
            setSession(null);
            setAuthStateError('No se pudo cargar el código de empleado. Intenta iniciar sesión nuevamente.');
            setIsLoading(false);
          }
        }
      },
      () => {
        authChangeId += 1;
        if (active) {
          setSession(null);
          setAuthStateError('No se pudo restaurar la sesión. Intenta iniciar sesión nuevamente.');
          setIsLoading(false);
        }
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback((credentials: LoginForm): Promise<void> => (
    signInWithEmail(credentials)
  ), []);

  const register = useCallback((credentials: RegisterForm): Promise<void> => (
    registerWithEmail(credentials)
  ), []);

  const resetPassword = useCallback((credentials: PasswordResetForm): Promise<void> => (
    sendPasswordReset(credentials)
  ), []);

  const signOut = useCallback((): Promise<void> => signOutFromFirebase(), []);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      authStateError,
      signIn,
      register,
      resetPassword,
      signOut,
    }),
    [authStateError, isLoading, register, resetPassword, session, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe utilizarse dentro de SessionProvider');
  }
  return context;
};
