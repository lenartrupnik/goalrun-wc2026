import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { AuthDivider } from "@/components/auth/AuthDivider";

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back" subtitle="Sign in to track your runs">
      <SocialAuthButtons />
      <AuthDivider />
      <LoginForm />
    </AuthCard>
  );
}