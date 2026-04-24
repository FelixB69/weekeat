"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(6, "Mot de passe trop court (6 caractères min.)"),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setSubmitError(
        error.message === "Invalid login credentials"
          ? "E-mail ou mot de passe incorrect."
          : error.message
      );
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5 anim-fadeUp">
      <div>
        <div className="eyebrow text-[var(--accent)]">Weekeat</div>
        <h1 className="display-lg mt-1 whitespace-pre-line">{"Bon\nretour."}</h1>
        <p className="text-sm text-[var(--t2)] mt-2 leading-relaxed">
          Connectez-vous pour retrouver vos plannings.
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="input-label" htmlFor="email">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="marie@example.com"
            {...register("email")}
          />
          {errors.email && <p className="input-error">{errors.email.message}</p>}
        </div>

        <div>
          <label className="input-label" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && <p className="input-error">{errors.password.message}</p>}
        </div>

        {submitError && (
          <div className="bg-[var(--error-soft)] text-[var(--error)] rounded-xl px-4 py-3 text-sm font-semibold">
            {submitError}
          </div>
        )}

        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner" /> : "Se connecter"}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--t2)]">
        Pas de compte ?{" "}
        <Link href="/register" className="text-[var(--accent)] font-bold">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}
