"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Goal, Footprints } from "lucide-react";
import { APP_TAGLINE } from "@/lib/constants";
import { buttonStyles } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MotionFadeIn } from "@/components/ui/MotionFadeIn";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute inset-0 pitch-pattern opacity-50" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <MotionFadeIn>
          <Badge className="mb-6 border-goal-gold/30 bg-goal-gold/10 text-goal-gold">
            FIFA World Cup 2026
          </Badge>
        </MotionFadeIn>

        <MotionFadeIn delay={0.1}>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Every Goal.{" "}
            <span className="text-pitch-300">One Kilometer.</span>
          </h1>
        </MotionFadeIn>

        <MotionFadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-goal-muted">
            {APP_TAGLINE} — For every goal scored at World Cup 2026, you and
            your friends run 1 km. Track progress, compete on the leaderboard,
            and stay fit through the tournament.
          </p>
        </MotionFadeIn>

        <MotionFadeIn delay={0.3}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link href="/signup" className={buttonStyles("primary", "lg")}>
                <Footprints className="h-5 w-5" />
                Join the Challenge
              </Link>
            </motion.div>
            <Link href="/login" className={buttonStyles("outline", "lg")}>
              Already joined? Log in
            </Link>
          </div>
        </MotionFadeIn>

        <MotionFadeIn delay={0.4}>
          <div className="mt-16 flex items-center justify-center gap-8 text-goal-muted">
            <div className="flex items-center gap-2">
              <Goal className="h-5 w-5 text-goal-gold" />
              <span className="text-sm">Live goal tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Footprints className="h-5 w-5 text-pitch-300" />
              <span className="text-sm">Realtime leaderboard</span>
            </div>
          </div>
        </MotionFadeIn>
      </div>
    </section>
  );
}