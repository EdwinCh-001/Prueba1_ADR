import { z } from 'zod';

export const meterCodeSchema = z
  .string()
  .regex(/^MED-\d{6}$/, 'El código debe tener el formato MED-123456');

export const meterStatusSchema = z.enum(['normal', 'inaccesible', 'danado']);
export const syncStatusSchema = z.enum(['pendiente', 'enviada']);
export const verificationStatusSchema = z.enum(['pendiente', 'verificada', 'inconsistente']);

export const meterSchema = z.object({
  code: meterCodeSchema,
  address: z.string().min(1),
  sector: z.string().min(1),
  accountNumber: z.string().min(1),
  status: z.string().min(1),
  previousReading: z.number().nonnegative(),
  previousReadingDate: z.string().min(1),
  monthlyAverage: z.number().nonnegative(),
});

export const readingSchema = z.object({
  id: z.string().min(1),
  meterCode: meterCodeSchema,
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'El período debe tener el formato AAAA-MM'),
  meterStatus: meterStatusSchema,
  currentReading: z.number().nonnegative().nullable(),
  previousReading: z.number().nonnegative().nullable(),
  consumption: z.number().nonnegative().nullable(),
  reason: z.string().nullable(),
  damageDescription: z.string().nullable(),
  photoPath: z.string().min(1).nullable(),
  syncStatus: syncStatusSchema,
  verificationPending: z.boolean(),
  verificationStatus: verificationStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const draftSchema = z.object({
  employeeCode: z.string().min(1),
  meterCode: meterCodeSchema.nullable(),
  currentStep: z.string().min(1),
  payloadJson: z.string().min(2),
  photoPath: z.string().min(1).nullable(),
  updatedAt: z.string().min(1),
});

export const sessionSchema = z.object({
  employeeCode: z.string().min(1),
  isActive: z.boolean(),
});

export const loginFormSchema = z.object({
  employeeCode: z.string().min(1, 'Ingresa tu código de empleado'),
  password: z.string().min(1, 'Ingresa tu clave'),
});

export const draftFormSchema = z.object({
  meterStatus: meterStatusSchema,
  currentReading: z.string(),
  reason: z.string(),
  damageDescription: z.string(),
  photoPath: z.string().min(1).nullable(),
  anomalyConfirmed: z.boolean(),
});

export const registrationDraftPayloadSchema = z.object({
  meter: meterSchema,
  form: draftFormSchema,
});

export const hasMeaningfulDraftData = (
  form: Partial<Pick<
    z.infer<typeof draftFormSchema>,
    'currentReading' | 'reason' | 'damageDescription' | 'photoPath'
  >>,
): boolean =>
  (form.currentReading?.trim().length ?? 0) > 0
  || (form.reason?.trim().length ?? 0) > 0
  || (form.damageDescription?.trim().length ?? 0) > 0
  || (typeof form.photoPath === 'string' && form.photoPath.length > 0);

export const isAnomalousConsumption = (
  currentReading: number | null,
  previousReading: number,
  monthlyAverage: number,
): boolean =>
  currentReading !== null
  && currentReading - previousReading > monthlyAverage * 3;

export const isPhotoRequired = (
  meterStatus: z.infer<typeof meterStatusSchema>,
  currentReading: number | null,
  previousReading: number,
  monthlyAverage: number,
): boolean =>
  meterStatus === 'danado'
  || isAnomalousConsumption(currentReading, previousReading, monthlyAverage);

export const readingFormSchema = draftFormSchema
  .extend({
    currentReading: z
      .string()
      .refine((value) => value.trim() === '' || /^\d+(\.\d+)?$/.test(value), 'Ingresa una lectura válida'),
  })
  .superRefine((value, context) => {
    if (value.meterStatus === 'normal' && value.currentReading.trim() === '') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentReading'],
        message: 'La lectura es obligatoria para un medidor normal',
      });
    }

    if (value.meterStatus === 'inaccesible' && value.reason.trim() === '') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'Indica el motivo de inaccesibilidad',
      });
    }

    if (value.meterStatus === 'danado' && value.damageDescription.trim() === '') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['damageDescription'],
        message: 'Describe el daño del medidor',
      });
    }
  });

export type MeterCode = z.infer<typeof meterCodeSchema>;
export type MeterStatus = z.infer<typeof meterStatusSchema>;
export type SyncStatus = z.infer<typeof syncStatusSchema>;
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
export type Meter = z.infer<typeof meterSchema>;
export type Reading = z.infer<typeof readingSchema>;
export type Draft = z.infer<typeof draftSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type LoginForm = z.infer<typeof loginFormSchema>;
export type ReadingForm = z.infer<typeof readingFormSchema>;
