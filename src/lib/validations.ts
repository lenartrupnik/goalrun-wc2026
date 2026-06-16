import { z } from "zod";

export const logRunSchema = z.object({
  distance_km: z
    .number({ invalid_type_error: "Distance must be a number" })
    .min(0.1, "Minimum 0.1 km")
    .max(999, "Maximum 999 km"),
  run_date: z.string().min(1, "Date is required"),
  notes: z.string().max(500).optional(),
  activity_type: z.enum(['run', 'bike']).default('run'),
});

export const updateRunSchema = z.object({
  distance_km: logRunSchema.shape.distance_km,
  notes: logRunSchema.shape.notes,
  activity_type: z.enum(['run', 'bike']).optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
    display_name: z
      .string()
      .min(2, "Display name must be at least 2 characters")
      .max(50, "Display name must be at most 50 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** @deprecated Use signInSchema or signUpSchema */
export const authSchema = signInSchema;

export type LogRunInput = z.infer<typeof logRunSchema>;
export type UpdateRunInput = z.infer<typeof updateRunSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type AuthInput = SignInInput;