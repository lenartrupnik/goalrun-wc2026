"use server";

import { revalidatePath } from "next/cache";
import { isPowerUser } from "@/lib/auth/power-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logRunSchema } from "@/lib/validations";

const RESET_CONFIRMATION = "RESET";

async function requirePowerUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isPowerUser(user.email)) {
    return { error: "Unauthorized" as const, user: null };
  }

  return { error: null, user };
}

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

export async function deleteMyRuns() {
  const auth = await requirePowerUser();
  if (auth.error) return { error: auth.error };

  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user!.id);

  if (countError) {
    return { error: countError.message };
  }

  if (!count) {
    return { success: true, deletedCount: 0, message: "You have no runs to delete." };
  }

  const { error } = await supabase.from("runs").delete().eq("user_id", auth.user!.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return {
    success: true,
    deletedCount: count,
    message: `Deleted ${count} run${count === 1 ? "" : "s"} from your account.`,
  };
}

export async function deleteAllRuns(formData: FormData) {
  const auth = await requirePowerUser();
  if (auth.error) return { error: auth.error };

  const confirmation = (formData.get("confirmation") as string | null)?.trim();
  if (confirmation !== RESET_CONFIRMATION) {
    return { error: `Type ${RESET_CONFIRMATION} to confirm.` };
  }

  const admin = createAdminClient();
  const { count, error: countError } = await admin
    .from("runs")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return { error: countError.message };
  }

  if (!count) {
    return { success: true, deletedCount: 0, message: "No runs in the database." };
  }

  // PostgREST requires a filter on delete; this matches every real row.
  const { error } = await admin
    .from("runs")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return {
    success: true,
    deletedCount: count,
    message: `Deleted all ${count} run${count === 1 ? "" : "s"} from every account.`,
  };
}