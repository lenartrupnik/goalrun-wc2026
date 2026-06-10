import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeroSection } from "@/components/landing/HeroSection";
import { ChallengeSection } from "@/components/landing/ChallengeSection";
import { StatsPreview } from "@/components/landing/StatsPreview";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <StatsPreview />
        <ChallengeSection />
      </main>
      <SiteFooter />
    </div>
  );
}