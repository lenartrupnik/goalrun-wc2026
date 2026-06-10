import Link from "next/link";
import { Trophy } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Container } from "./Container";
import { buttonStyles } from "@/components/ui/Button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-pitch-700/50 bg-pitch-950/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Trophy className="h-6 w-6 text-goal-gold" />
          <span>{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-goal-muted transition-colors hover:text-goal-white"
          >
            Log in
          </Link>
          <Link href="/signup" className={buttonStyles("primary", "sm")}>
            Join Challenge
          </Link>
        </nav>
      </Container>
    </header>
  );
}