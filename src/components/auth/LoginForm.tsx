"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInWithEmail } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface LoginFormProps {
  defaultEmail?: string;
  infoMessage?: string;
}

export function LoginForm({ defaultEmail, infoMessage }: LoginFormProps = {}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await signInWithEmail(formData)) ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      {infoMessage && (
        <p className="text-sm text-pitch-300">{infoMessage}</p>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm text-goal-muted">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          defaultValue={defaultEmail}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm text-goal-muted">
          Password
        </label>
        <Input id="password" name="password" type="password" required minLength={6} />
      </div>

      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-goal-muted">
        No account?{" "}
        <Link href="/signup" className="text-pitch-300 hover:underline">
          Join the challenge
        </Link>
      </p>
    </form>
  );
}