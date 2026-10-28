import * as SecureStore from 'expo-secure-store';

import type { Session } from '../types/domain';

const EMPLOYEE_CODE_KEY = 'epmaps.session.employeeCode';
const ACTIVE_KEY = 'epmaps.session.active';

export const saveSession = async (session: Session): Promise<void> => {
  await SecureStore.setItemAsync(EMPLOYEE_CODE_KEY, session.employeeCode);
  await SecureStore.setItemAsync(ACTIVE_KEY, String(session.isActive));
};

export const getSession = async (): Promise<Session | null> => {
  const [employeeCode, active] = await Promise.all([
    SecureStore.getItemAsync(EMPLOYEE_CODE_KEY),
    SecureStore.getItemAsync(ACTIVE_KEY),
  ]);

  if (!employeeCode || active !== 'true') {
    return null;
  }

  return { employeeCode, isActive: true };
};

export const clearSession = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(EMPLOYEE_CODE_KEY),
    SecureStore.deleteItemAsync(ACTIVE_KEY),
  ]);
};
