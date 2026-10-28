import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { Meter, MeterStatus, Reading, ReadingForm } from '../types/domain';

interface ReadingContextValue {
  meter: Meter | null;
  form: ReadingForm | null;
  editingReading: Reading | null;
  setMeter: (meter: Meter) => void;
  setForm: (form: ReadingForm) => void;
  setEditingReading: (reading: Reading | null) => void;
  clearReading: () => void;
}

const ReadingContext = createContext<ReadingContextValue | null>(null);

export function ReadingProvider({ children }: React.PropsWithChildren): React.JSX.Element {
  const [meter, setMeterState] = useState<Meter | null>(null);
  const [form, setFormState] = useState<ReadingForm | null>(null);
  const [editingReading, setEditingReadingState] = useState<Reading | null>(null);

  const setMeter = useCallback((value: Meter): void => {
    setMeterState(value);
    setFormState(null);
    setEditingReadingState(null);
  }, []);

  const setForm = useCallback((value: ReadingForm): void => {
    setFormState(value);
  }, []);

  const clearReading = useCallback((): void => {
    setMeterState(null);
    setFormState(null);
    setEditingReadingState(null);
  }, []);
  const setEditingReading = useCallback((value: Reading | null): void => {
    setEditingReadingState(value);
  }, []);

  const value = useMemo(
    () => ({ meter, form, editingReading, setMeter, setForm, setEditingReading, clearReading }),
    [clearReading, editingReading, form, meter, setEditingReading, setForm, setMeter],
  );

  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>;
}

export const useReading = (): ReadingContextValue => {
  const context = useContext(ReadingContext);
  if (!context) {
    throw new Error('useReading debe utilizarse dentro de ReadingProvider');
  }
  return context;
};

export const meterStatusLabels: Record<MeterStatus, string> = {
  normal: 'Normal',
  inaccesible: 'Inaccesible',
  danado: 'Dañado',
};
