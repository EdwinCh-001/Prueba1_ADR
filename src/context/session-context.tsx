import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEMO_EMPLOYEE_CODE, DEMO_PASSWORD } from '../constants/auth';
import { clearSession, getSession, saveSession } from '../database/session-store';
import type { LoginForm, Session } from '../types/domain';

interface SessionContextValue {
  session: Session | null;
  isLoading: boolean;
  signIn: (credentials: LoginForm) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: React.PropsWithChildren): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void getSession()
      .then((storedSession) => {
        if (isMounted) {
          setSession(storedSession);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginForm): Promise<boolean> => {
    if (
      credentials.employeeCode.trim().toUpperCase() !== DEMO_EMPLOYEE_CODE ||
      credentials.password !== DEMO_PASSWORD
    ) {
      return false;
    }

    const activeSession: Session = {
      employeeCode: DEMO_EMPLOYEE_CODE,
      isActive: true,
    };
    await saveSession(activeSession);
    setSession(activeSession);
    return true;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, isLoading, signIn, signOut }),
    [isLoading, session, signIn, signOut],
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
