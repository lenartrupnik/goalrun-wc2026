import { Goal, Footprints, Trophy } from "lucide-react";
import { MotionFadeIn } from "@/components/ui/MotionFadeIn";
import { Card } from "@/components/ui/Card";

const steps = [
  {
    icon: Goal,
    title: "Goals Are Scored",
    description:
      "We pull live scores from the World Cup 2026 API. Every goal adds 1 km to everyone's target.",
  },
  {
    icon: Footprints,
    title: "You Log Your Runs",
    description:
      "After each workout, log your distance. Track km run, km remaining, and your completion %.",
  },
  {
    icon: Trophy,
    title: "Climb the Leaderboard",
    description:
      "See who's keeping pace in realtime. Compete with friends and celebrate milestones together.",
  },
];

export function ChallengeSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MotionFadeIn>
          <h2 className="text-center text-3xl font-bold">How It Works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-goal-muted">
            Simple rules, serious motivation. The more goals scored, the more
            kilometers you owe.
          </p>
        </MotionFadeIn>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <MotionFadeIn key={step.title} delay={0.1 * (i + 1)}>
              <Card className="h-full text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pitch-800">
                  <step.icon className="h-6 w-6 text-pitch-300" />
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-goal-muted">{step.description}</p>
              </Card>
            </MotionFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}