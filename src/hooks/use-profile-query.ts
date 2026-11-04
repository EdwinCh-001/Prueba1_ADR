import { useQuery } from '@tanstack/react-query';

import { getUserProfile } from '../repositories/profile-repository';
import { auth } from '../services/firebase';

export const profileQueryKey = (uid: string | undefined): readonly ['user-profile', string | undefined] => (
  ['user-profile', uid]
);

export const useProfileQuery = () => {
  const user = auth?.currentUser ?? null;

  return useQuery({
    queryKey: profileQueryKey(user?.uid),
    enabled: user !== null,
    queryFn: () => {
      if (!user) {
        throw new Error('Inicia sesión para consultar el perfil.');
      }

      return getUserProfile(user.uid, user.displayName ?? '');
    },
    staleTime: 5 * 60 * 1000,
  });
};
