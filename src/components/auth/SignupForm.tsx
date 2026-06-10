"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpWithEmail } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean; message?: string } | null,
      formData: FormData
    ) => {
      return (await signUpWithEmail(formData)) ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="display_name" className="mb-1.5 block text-sm text-goal-muted">
          Display name
        </label>
        <Input id="display_name" name="display_name" required placeholder="Runner name" />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm text-goal-muted">
          Email
        </label>
        <Input id="email" name="email" type="email" required placeholder="you@example.com" />
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
      {state?.success && state.message && (
        <p className="text-sm text-pitch-300">{state.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Join the Challenge"}
      </Button>

      <p className="text-center text-sm text-goal-muted">
        Already joined?{" "}
        <Link href="/login" className="text-pitch-300 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}