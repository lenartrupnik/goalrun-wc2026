import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
// import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
// import { AuthDivider } from "@/components/auth/AuthDivider";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; from?: string }>;
}) {
  const { email, from } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const infoMessage =
    from === "signup"
      ? "An account with this email already exists. Please sign in."
      : undefined;

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to track your runs">
      {/* Re-enable when Google OAuth is configured in Supabase:
      <SocialAuthButtons />
      <AuthDivider />
      */}
      <LoginForm defaultEmail={email} infoMessage={infoMessage} />
    </AuthCard>
  );
}