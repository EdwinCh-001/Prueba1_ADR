import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

const DOCUMENT_DIRECTORY = FileSystem.documentDirectory;
const getPhotoDirectory = (): string => {
  if (!DOCUMENT_DIRECTORY) {
    throw new Error('El almacenamiento persistente de fotografías no está disponible.');
  }
  return `${DOCUMENT_DIRECTORY}meter-photos/`;
};

export const captureMeterPhoto = async (): Promise<
  { path?: string; denied: false } | { denied: true }
> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { denied: true };
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    mediaTypes: ['images'],
    quality: 0.6,
    exif: false,
  });

  if (result.canceled || !result.assets[0]) {
    return { denied: false };
  }

  const photoDirectory = getPhotoDirectory();
  await FileSystem.makeDirectoryAsync(photoDirectory, { intermediates: true });
  const destination = `${photoDirectory}meter-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  await FileSystem.copyAsync({ from: result.assets[0].uri, to: destination });
  const storedPhoto = await FileSystem.getInfoAsync(destination);
  if (!storedPhoto.exists) {
    throw new Error('No se pudo conservar la fotografía en el almacenamiento de la aplicación.');
  }
  return { denied: false, path: destination };
};

export const isStoredPhotoAvailable = async (path: string): Promise<boolean> => {
  if (!path.startsWith(getPhotoDirectory())) {
    return false;
  }
  const fileInfo = await FileSystem.getInfoAsync(path);
  return fileInfo.exists && !fileInfo.isDirectory && fileInfo.size > 0;
};

export const deleteStoredPhoto = async (path: string | null): Promise<void> => {
  if (!path) {
    return;
  }

  const fileInfo = await FileSystem.getInfoAsync(path);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
};
