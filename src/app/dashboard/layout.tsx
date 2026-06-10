import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Container } from "@/components/layout/Container";
import type { Profile } from "@/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const profile = profileData as Pick<Profile, "display_name"> | null;

  return (
    <div className="min-h-screen pitch-pattern">
      <DashboardNav displayName={profile?.display_name ?? user.email ?? "Runner"} />
      <Container className="py-8">{children}</Container>
    </div>
  );
}