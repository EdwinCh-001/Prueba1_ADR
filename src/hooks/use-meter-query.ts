import { useQuery } from '@tanstack/react-query';

import { fetchMeter } from '../api/meter-api';
import { findCachedMeter, saveCachedMeter } from '../repositories/meter-cache-repository';
import { meterCodeSchema } from '../types/schemas';
import type { Meter } from '../types/domain';

const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const isFresh = (cachedAt: string): boolean =>
  Date.now() - new Date(cachedAt).getTime() < CACHE_MAX_AGE_MS;

const getMeter = async (code: string, signal: AbortSignal): Promise<Meter> => {
  const cachedMeter = await findCachedMeter(code);
  if (cachedMeter && isFresh(cachedMeter.cachedAt)) {
    return cachedMeter;
  }

  try {
    const meter = await fetchMeter(code, signal);
    await saveCachedMeter(meter, new Date().toISOString());
    return meter;
  } catch (error) {
    if (cachedMeter) {
      return cachedMeter;
    }
    throw error;
  }
};

export const useMeterQuery = (code: string) => {
  const parsedCode = meterCodeSchema.safeParse(code);
  const validCode = parsedCode.success ? parsedCode.data : '';

  return useQuery({
    queryKey: ['meter', validCode || null],
    queryFn: ({ signal }) => getMeter(validCode, signal),
    enabled: parsedCode.success,
    networkMode: 'online',
    retry: (failureCount, error) =>
      failureCount < 1 && !(error instanceof Error && error.name === 'AbortError'),
    staleTime: CACHE_MAX_AGE_MS,
    gcTime: 24 * 60 * 60 * 1000,
  });
};
