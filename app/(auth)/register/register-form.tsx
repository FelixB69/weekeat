"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  displayName: z.string().min(2, "Prénom requis (2 caractères min.)"),
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(6, "Mot de passe trop court (6 caractères min.)"),
});
type Values = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  const onSubmit = async (values: Values) => {
    setSubmitError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { display_name: values.displayName },
      },
    });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    if (!data.session) {
      setNeedsConfirm(true);
      return;
    }
    router.push("/");
    router.refresh();
  };

  if (needsConfirm) {
    return (
      <div className="flex flex-col gap-4 anim-fadeUp">
        <div className="eyebrow text-[var(--accent)]">Bienvenue</div>
        <h1 className="display-lg">Un e-mail vous attend.</h1>
        <p className="text-sm text-[var(--t2)] leading-relaxed">
          Nous venons d&apos;envoyer un lien de confirmation. Cliquez dessus pour activer votre
          compte et revenir ici.
        </p>
        <Link href="/login" className="btn btn-secondary w-full mt-4">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 anim-fadeUp">
      <div>
        <div className="eyebrow text-[var(--accent)]">Weekeat</div>
        <h1 className="display-lg mt-1 whitespace-pre-line">{"Créer\nun compte."}</h1>
        <p className="text-sm text-[var(--t2)] mt-2 leading-relaxed">
          Rejoignez Weekeat gratuitement.
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="input-label" htmlFor="displayName">
            Prénom
          </label>
          <input
            id="displayName"
            autoComplete="given-name"
            className="input"
            placeholder="Marie"
            {...register("displayName")}
          />
          {errors.displayName && <p className="input-error">{errors.displayName.message}</p>}
        </div>
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
            autoComplete="new-password"
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
          {isSubmitting ? <span className="spinner" /> : "Créer mon compte"}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--t2)]">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-[var(--accent)] font-bold">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
