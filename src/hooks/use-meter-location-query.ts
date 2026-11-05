import { useQuery } from '@tanstack/react-query';

import { findLatestLocatedReadingByMeter } from '../repositories/reading-repository';
import { meterCodeSchema } from '../types/schemas';

export const useMeterLocationQuery = (meterCode: string) => {
  const parsedCode = meterCodeSchema.safeParse(meterCode);
  const validCode = parsedCode.success ? parsedCode.data : '';

  return useQuery({
    queryKey: ['meter-location', validCode || null],
    queryFn: async () => {
      const reading = await findLatestLocatedReadingByMeter(validCode);
      if (
        !reading
        || reading.latitude === null
        || reading.longitude === null
        || reading.locationSource === null
      ) {
        return null;
      }
      return {
        latitude: reading.latitude,
        longitude: reading.longitude,
        locationSource: reading.locationSource,
        createdAt: reading.createdAt,
        period: reading.period,
      };
    },
    enabled: parsedCode.success,
  });
};
