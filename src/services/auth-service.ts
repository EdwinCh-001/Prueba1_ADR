import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';

import { requireFirebaseAuth } from './firebase';
import { createInitialUserProfile } from '../repositories/profile-repository';
import type { LoginForm, PasswordResetForm, RegisterForm } from '../types/domain';

export class FirebaseAuthServiceError extends Error {
  constructor(code: string) {
    super(code);
    this.name = 'FirebaseAuthServiceError';
  }
}

export const signInWithEmail = async (credentials: LoginForm): Promise<void> => {
  const auth = requireFirebaseAuth();
  const { user } = await signInWithEmailAndPassword(
    auth,
    credentials.email.trim(),
    credentials.password,
  );

  if (!user.emailVerified) {
    try {
      await sendEmailVerification(user);
    } finally {
      await firebaseSignOut(auth);
    }

    throw new FirebaseAuthServiceError('auth/email-not-verified');
  }
}

export const registerWithEmail = async (credentials: RegisterForm): Promise<void> => {
  const auth = requireFirebaseAuth();
  const { user } = await createUserWithEmailAndPassword(
    auth,
    credentials.email.trim(),
    credentials.password,
  );

  try {
    const employeeCode = credentials.employeeCode.trim();
    await updateProfile(user, { displayName: employeeCode });
    await createInitialUserProfile(user.uid, employeeCode, credentials.displayName);
    await sendEmailVerification(user);
  } finally {
    await firebaseSignOut(auth);
  }
}

export const sendPasswordReset = async (credentials: PasswordResetForm): Promise<void> => {
  await sendPasswordResetEmail(requireFirebaseAuth(), credentials.email.trim());
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(requireFirebaseAuth());
};

const firebaseErrorMessages: Record<string, string> = {
  'auth/email-not-verified': 'Debes verificar tu correo. Te enviamos un nuevo enlace de verificación.',
  'auth/configuration-not-found': 'Firebase no está configurado. Completa las variables EXPO_PUBLIC_FIREBASE_*.',
  'auth/invalid-email': 'Ingresa una dirección de correo válida.',
  'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
  'auth/user-not-found': 'El correo o la contraseña no son correctos.',
  'auth/wrong-password': 'El correo o la contraseña no son correctos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/password-does-not-meet-requirements': 'La contraseña no cumple los requisitos de seguridad.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada. Contacta al administrador.',
  'auth/too-many-requests': 'Hubo demasiados intentos. Espera un momento e inténtalo nuevamente.',
  'auth/network-request-failed': 'No se pudo conectar. Revisa tu conexión a internet.',
  'auth/operation-not-allowed': 'El inicio de sesión con correo y contraseña no está habilitado.',
};

export const getAuthErrorMessage = (error: unknown): string => {
  const code = error instanceof Error && 'code' in error && typeof error.code === 'string'
    ? error.code
    : error instanceof FirebaseAuthServiceError
      ? error.message
      : null;

  if (error instanceof Error && error.name === 'FirebaseConfigurationError') {
    return error.message;
  }

  return (code && firebaseErrorMessages[code])
    ?? 'No se pudo completar la solicitud. Inténtalo nuevamente.';
};
