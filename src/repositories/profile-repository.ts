import { File } from 'expo-file-system';

import { getDatabase } from '../database/database';
import { deleteStoredProfilePhoto, saveProfilePhoto } from '../services/photo-storage';
import { userProfileSchema } from '../types/schemas';
import type { UserProfile } from '../types/domain';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface SelectedProfilePhoto {
  uri: string;
  mimeType: string | null;
}

export interface SaveProfileResult {
  profile: UserProfile;
  photoCleanupWarning: string | null;
}

interface StoredProfile {
  display_name: string;
  telefono_contacto: string;
  ruta_foto: string | null;
}

const findStoredProfile = async (uid: string): Promise<StoredProfile | null> => {
  const database = await getDatabase();
  return database.getFirstAsync<StoredProfile>(
    `SELECT nombre_visible AS display_name,
            telefono_contacto,
            ruta_foto
     FROM perfiles
     WHERE firebase_uid = ?`,
    uid,
  );
};

export const getEmployeeCode = async (
  uid: string,
  legacyFallback: string,
): Promise<string> => {
  const database = await getDatabase();
  const profile = await database.getFirstAsync<{ employee_code: string }>(
    `SELECT codigo_empleado AS employee_code
     FROM perfiles
     WHERE firebase_uid = ?`,
    uid,
  );
  const employeeCode = profile?.employee_code.trim() || legacyFallback.trim();
  if (!employeeCode) {
    throw new Error('No se encontró el código de empleado del usuario.');
  }
  return employeeCode;
};

export const createInitialUserProfile = async (
  uid: string,
  employeeCode: string,
  displayName: string,
): Promise<void> => {
  const profile = userProfileSchema.parse({
    displayName,
    phoneNumber: '',
    photoPath: null,
  });
  const database = await getDatabase();

  await database.runAsync(
    `INSERT INTO perfiles (
       firebase_uid,
       codigo_empleado,
       nombre_visible,
       telefono_contacto,
       ruta_foto,
       actualizado_en
     )
     VALUES (?, ?, ?, '', NULL, ?)
     ON CONFLICT(firebase_uid) DO UPDATE SET
       codigo_empleado = excluded.codigo_empleado,
       nombre_visible = excluded.nombre_visible,
       actualizado_en = excluded.actualizado_en`,
    uid,
    employeeCode,
    profile.displayName,
    new Date().toISOString(),
  );
};

export const getUserProfile = async (
  uid: string,
  fallbackDisplayName: string,
): Promise<UserProfile> => {
  const storedProfile = await findStoredProfile(uid);
  if (!storedProfile) {
    return {
      displayName: fallbackDisplayName.trim() || 'Técnico EPMAPS',
      phoneNumber: '',
      photoPath: null,
    };
  }

  return userProfileSchema.parse({
    displayName: storedProfile.display_name,
    phoneNumber: storedProfile.telefono_contacto,
    photoPath: storedProfile.ruta_foto,
  });
};

export const saveUserProfile = async (
  uid: string,
  employeeCode: string,
  values: UserProfile,
  selectedPhoto: SelectedProfilePhoto | null,
): Promise<SaveProfileResult> => {
  const validatedProfile = userProfileSchema.parse(values);
  const previousProfile = await findStoredProfile(uid);
  let newPhotoPath: string | null = null;

  if (selectedPhoto) {
    const mimeType = selectedPhoto.mimeType?.toLowerCase() ?? 'image/jpeg';
    if (!allowedImageTypes.has(mimeType)) {
      throw new Error('Selecciona una imagen JPG, PNG o WebP.');
    }

    const selectedFile = new File(selectedPhoto.uri);
    if (selectedFile.size > MAX_AVATAR_SIZE_BYTES) {
      throw new Error('La foto debe pesar menos de 5 MB.');
    }

    newPhotoPath = await saveProfilePhoto(selectedPhoto.uri, mimeType);
  }

  const profile = userProfileSchema.parse({
    ...validatedProfile,
    photoPath: newPhotoPath ?? validatedProfile.photoPath,
  });

  try {
    const database = await getDatabase();
    await database.runAsync(
      `INSERT INTO perfiles (
         firebase_uid,
         codigo_empleado,
         nombre_visible,
         telefono_contacto,
         ruta_foto,
         actualizado_en
       )
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(firebase_uid) DO UPDATE SET
         codigo_empleado = excluded.codigo_empleado,
         nombre_visible = excluded.nombre_visible,
         telefono_contacto = excluded.telefono_contacto,
         ruta_foto = excluded.ruta_foto,
         actualizado_en = excluded.actualizado_en`,
      uid,
      employeeCode,
      profile.displayName,
      profile.phoneNumber,
      profile.photoPath,
      new Date().toISOString(),
    );
  } catch (error) {
    if (newPhotoPath) {
      await deleteStoredProfilePhoto(newPhotoPath);
    }
    throw error;
  }

  let photoCleanupWarning: string | null = null;
  if (newPhotoPath && previousProfile?.ruta_foto) {
    try {
      await deleteStoredProfilePhoto(previousProfile.ruta_foto);
    } catch (error) {
      photoCleanupWarning = error instanceof Error
        ? error.message
        : 'No se pudo borrar la foto de perfil anterior.';
    }
  }

  return { profile, photoCleanupWarning };
};
