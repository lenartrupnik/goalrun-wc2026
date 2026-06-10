import { z } from "zod";

export const logRunSchema = z.object({
  distance_km: z
    .number({ invalid_type_error: "Distance must be a number" })
    .min(0.1, "Minimum 0.1 km")
    .max(999, "Maximum 999 km"),
  run_date: z.string().min(1, "Date is required"),
  notes: z.string().max(500).optional(),
});

export const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  display_name: z.string().min(2).max(50).optional(),
});

export type LogRunInput = z.infer<typeof logRunSchema>;
export type AuthInput = z.infer<typeof authSchema>;