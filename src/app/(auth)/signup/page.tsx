import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { AuthDivider } from "@/components/auth/AuthDivider";

export default function SignupPage() {
  return (
    <AuthCard
      title="Join the Challenge"
      subtitle="Every goal scored = 1 km you need to run"
    >
      <SocialAuthButtons />
      <AuthDivider />
      <SignupForm />
    </AuthCard>
  );
}