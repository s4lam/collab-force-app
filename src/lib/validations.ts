import { z } from "zod";

// ── Login ───────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Patient ─────────────────────────────────────────────
export const patientCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid date of birth",
  }),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const patientUpdateSchema = patientCreateSchema.partial();

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

// ── Appointment ─────────────────────────────────────────
export const appointmentCreateSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  staffId: z.string().min(1, "Staff member is required"),
  dateTime: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid date/time",
  }),
  duration: z.coerce.number().int().min(15).max(240).default(30),
  type: z.string().min(1, "Appointment type is required").max(100),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const appointmentUpdateSchema = appointmentCreateSchema.partial();

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;

// ── Search / Filter ─────────────────────────────────────
export const searchParamsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const appointmentFilterSchema = searchParamsSchema.extend({
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  date: z.string().optional(),
  staffId: z.string().optional(),
  patientId: z.string().optional(),
});
