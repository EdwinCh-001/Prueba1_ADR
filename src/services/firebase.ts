import { FirebaseError, getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

const firebaseConfigSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  appId: z.string().min(1),
  messagingSenderId: z.string().optional(),
});

const firebaseConfig = firebaseConfigSchema.safeParse({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
});

const toSecureStoreKey = (firebaseKey: string): string => {
  const encodedKey = firebaseKey
    .split('')
    .map((character) => character.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');

  return `firebase-auth.${encodedKey}`;
};

const secureStorePersistence = {
  getItem: (key: string): Promise<string | null> => (
    SecureStore.getItemAsync(toSecureStoreKey(key))
  ),
  setItem: (key: string, value: string): Promise<void> => (
    SecureStore.setItemAsync(toSecureStoreKey(key), value)
  ),
  removeItem: (key: string): Promise<void> => (
    SecureStore.deleteItemAsync(toSecureStoreKey(key))
  ),
};

const initializeFirebaseApp = (): FirebaseApp | null => {
  if (!firebaseConfig.success) {
    return null;
  }

  return getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig.data);
};

export const firebaseApp = initializeFirebaseApp();

type AuthPersistence = NonNullable<
  NonNullable<Parameters<typeof initializeAuth>[1]>['persistence']
>;

// Firebase's React Native export provides this helper, but its shared typings omit it.
const firebaseAuthWithReactNativePersistence = FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence: (storage: typeof secureStorePersistence) => AuthPersistence;
};

const initializeFirebaseAuth = (app: FirebaseApp | null): Auth | null => {
  if (!app) {
    return null;
  }

  try {
    return initializeAuth(app, {
      persistence: firebaseAuthWithReactNativePersistence.getReactNativePersistence(
        secureStorePersistence,
      ),
    });
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/already-initialized') {
      return getAuth(app);
    }

    throw error;
  }
};

export const auth = initializeFirebaseAuth(firebaseApp);

export class FirebaseConfigurationError extends Error {
  constructor() {
    super('Firebase no está configurado. Revisa las variables EXPO_PUBLIC_FIREBASE_*.');
    this.name = 'FirebaseConfigurationError';
  }
}

export const requireFirebaseAuth = (): Auth => {
  if (!auth) {
    throw new FirebaseConfigurationError();
  }

  return auth;
};

export const requireFirebaseApp = (): FirebaseApp => {
  if (!firebaseApp) {
    throw new FirebaseConfigurationError();
  }

  return firebaseApp;
};
