import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to track your runs">
      <SocialAuthButtons />
      <AuthDivider />
      <LoginForm />
    </AuthCard>
  );
}