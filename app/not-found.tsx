import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[var(--bg)] px-6 text-center">
      <div className="eyebrow text-[var(--accent)]">404</div>
      <h1 className="display-lg">Cette page n&apos;est pas au menu.</h1>
      <p className="text-sm text-[var(--t2)] max-w-xs">
        La recette que vous cherchez a peut-être été retirée ou déplacée.
      </p>
      <Link href="/" className="btn btn-primary mt-2">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
