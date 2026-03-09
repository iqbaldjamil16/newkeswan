
import { z } from 'zod';

export const treatmentSchema = z.object({
  medicineType: z.string().min(1, "Wajib diisi."),
  medicineName: z.string().min(1, "Wajib diisi."),
  dosageValue: z.coerce.number().gt(0, "Dosis harus lebih dari 0."),
  dosageUnit: z.string().min(1, "Wajib diisi."),
});

export const caseDevelopmentEntrySchema = z.object({
  status: z.string().min(1, "Wajib diisi."),
  count: z.coerce.number().min(1, "Jumlah harus minimal 1."),
});


export const serviceSchema = z.object({
  id: z.string().optional(),
  date: z.date({
    required_error: "Wajib diisi.",
  }),
  puskeswan: z.string().min(1, "Wajib diisi."),
  officerName: z.string().min(1, "Wajib diisi."),
  ownerName: z.string().min(1, "Wajib diisi."),
  ownerAddress: z.string().min(1, "Wajib diisi."),
  caseId: z.string().optional().default('').refine(
    (val) => {
      if (!val) return true;
      return /^\d{8,10}$/.test(val);
    },
    {
      message: "ID Kasus iSIKHNAS harus terdiri dari 8 hingga 10 angka.",
    }
  ),
  livestockType: z.string().min(1, "Wajib diisi."),
  livestockCount: z.coerce.number().min(1, "Jumlah ternak harus minimal 1."),
  clinicalSymptoms: z.string().min(1, "Wajib diisi."),
  diagnosis: z.string().min(1, "Wajib diisi."),
  treatmentType: z.string().min(1, "Wajib diisi."),
  photoUrl: z.string().optional(),
  treatments: z.array(treatmentSchema).min(1, "Minimal satu pengobatan harus ditambahkan."),
  caseDevelopment: z.string().optional(),
  caseDevelopments: z.array(caseDevelopmentEntrySchema).min(1, "Minimal satu perkembangan kasus wajib ditambahkan.").optional(),
}).superRefine((data, ctx) => {
  if (data.caseDevelopments && data.caseDevelopments.length > 0) {
    const totalDevelopmentCount = data.caseDevelopments.reduce((sum, dev) => sum + dev.count, 0);
    if (totalDevelopmentCount > data.livestockCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total jumlah pada perkembangan kasus (${totalDevelopmentCount}) tidak boleh melebihi jumlah ternak (${data.livestockCount}).`,
        path: ["caseDevelopments"],
      });
    }
  }
});

export type HealthcareService = z.infer<typeof serviceSchema>;
export type Treatment = z.infer<typeof treatmentSchema>;
export type CaseDevelopmentEntry = z.infer<typeof caseDevelopmentEntrySchema>;
