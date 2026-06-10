import { Container } from "./Container";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-pitch-700/50 py-8">
      <Container className="text-center text-sm text-goal-muted">
        <p>
          {APP_NAME} — {APP_TAGLINE}
        </p>
        <p className="mt-1">Open source · FIFA World Cup 2026</p>
      </Container>
    </footer>
  );
}