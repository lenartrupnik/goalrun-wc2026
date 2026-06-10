"use client";

import Link from "next/link";
import { LogOut, Trophy } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { signOut } from "@/lib/actions/auth";
import { Container } from "./Container";
import { Button } from "@/components/ui/Button";

interface DashboardNavProps {
  displayName: string;
}

export function DashboardNav({ displayName }: DashboardNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-pitch-700/50 bg-pitch-950/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Trophy className="h-6 w-6 text-goal-gold" />
          <span>{APP_NAME}</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-goal-muted sm:inline">
            {displayName}
          </span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </Container>
    </header>
  );
}