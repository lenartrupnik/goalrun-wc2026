"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logRunSchema } from "@/lib/validations";

export async function logRun(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to log a run" };
  }

  const parsed = logRunSchema.safeParse({
    distance_km: parseFloat(formData.get("distance_km") as string),
    run_date: formData.get("run_date") as string,
    notes: (formData.get("notes") as string) || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase.from("runs").insert({
    user_id: user.id,
    distance_km: parsed.data.distance_km,
    run_date: parsed.data.run_date,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}