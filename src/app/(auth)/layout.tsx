import { Trophy } from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 pitch-pattern">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
        <Trophy className="h-6 w-6 text-goal-gold" />
        <span>{APP_NAME}</span>
      </Link>
      {children}
    </div>
  );
}