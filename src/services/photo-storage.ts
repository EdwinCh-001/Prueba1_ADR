import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

const PHOTO_DIRECTORY = `${FileSystem.documentDirectory ?? ''}meter-photos/`;

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
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) {
    return { denied: false };
  }

  await FileSystem.makeDirectoryAsync(PHOTO_DIRECTORY, { intermediates: true });
  const destination = `${PHOTO_DIRECTORY}meter-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: result.assets[0].uri, to: destination });
  return { denied: false, path: destination };
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
