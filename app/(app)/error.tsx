"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="p-6 flex flex-col items-center gap-4 text-center pt-20">
      <div className="eyebrow text-[var(--error)]">Erreur</div>
      <h2 className="display-md">Quelque chose s&apos;est mal passé.</h2>
      <p className="text-sm text-[var(--t2)] max-w-sm">
        {error.message || "Réessayez dans un instant — vos données restent en sécurité."}
      </p>
      <button className="btn btn-secondary" onClick={() => reset()}>
        Réessayer
      </button>
    </div>
  );
}
