import { Card } from "@/components/ui/Card";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md border-pitch-600" glow>
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-goal-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </Card>
  );
}