"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePlats } from "@/lib/hooks/use-plats";
import { IconArrow, IconClock, IconPlus, IconSearch } from "@/components/ui/icons";
import { CATEGORIE_EMOJIS, CATEGORIE_LABELS, cn } from "@/lib/utils";
import type { PlatCategorie } from "@/lib/types/database.types";

const FILTERS: { key: "tout" | PlatCategorie; label: string }[] = [
  { key: "tout", label: "Tout" },
  { key: "viande", label: "Viande" },
  { key: "poisson", label: "Poisson" },
  { key: "pates", label: "Pâtes" },
  { key: "vegetarien", label: "Végétarien" },
  { key: "vegan", label: "Vegan" },
  { key: "soupe", label: "Soupe" },
  { key: "autre", label: "Autre" },
];

export function PlatsList() {
  const { data: plats, isLoading, isError, error } = usePlats();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("tout");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const list = plats ?? [];
    return list.filter((p) => {
      if (filter !== "tout" && p.categorie !== filter) return false;
      if (q && !p.nom.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [plats, filter, q]);

  return (
    <div className="anim-fadeUp pb-6 relative">
      <header className="px-6 pt-6">
        <h1 className="display-lg">Mes plats</h1>
        <p className="text-[13px] text-[var(--t2)] mt-1">
          {plats ? `${plats.length} recettes dans votre base` : "Chargement…"}
        </p>
      </header>

      <div className="px-6 pt-4">
        <label className="flex items-center gap-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 py-2.5">
          <IconSearch className="text-[var(--t3)]" />
          <input
            type="search"
            placeholder="Rechercher…"
            className="flex-1 bg-transparent outline-none text-sm font-sans text-[var(--t1)] placeholder:text-[var(--t3)]"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>

      <div className="px-6 pt-3 pb-4 flex gap-2 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn("chip", filter === f.key && "active")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <ListSkeleton />}
      {isError && (
        <div className="px-6 py-10 text-center text-sm text-[var(--error)]">
          Impossible de charger vos plats. {error instanceof Error ? error.message : ""}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <div className="text-4xl grayscale opacity-30">🍽️</div>
          <div className="font-sans text-[17px] font-bold text-[var(--t2)]">
            {plats?.length ? "Aucun résultat" : "Votre livre de recettes est vide"}
          </div>
          <div className="text-[13px] text-[var(--t3)] leading-relaxed max-w-xs">
            {plats?.length
              ? "Essayez un autre filtre ou un autre mot."
              : "Ajoutez votre premier plat pour commencer à planifier."}
          </div>
          <Link href="/plats/nouveau" className="btn btn-primary mt-3">
            <IconPlus /> Nouveau plat
          </Link>
        </div>
      )}

      {filtered.length > 0 && (
        <ul className="flex flex-col gap-2.5 px-5">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                href={`/plats/${p.id}`}
                className="dish-list-item flex items-center gap-3.5 p-3 pl-3 pr-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] transition-colors active:border-[var(--accent)]"
              >
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl"
                  style={{ background: "var(--border-soft)" }}
                >
                  {CATEGORIE_EMOJIS[p.categorie]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-[var(--accent)] tracking-wide">
                    {CATEGORIE_LABELS[p.categorie]}
                  </div>
                  <div className="font-sans text-[15px] font-bold text-[var(--t1)] truncate">
                    {p.nom}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[var(--t2)]">
                    <IconClock /> {p.temps_cuisson ? `${p.temps_cuisson} min` : "—"}
                    <span className="w-[3px] h-[3px] rounded-full bg-[var(--border)]" />
                    <span className="text-[var(--t3)] font-semibold">
                      {p.ingredients.length} ingrédient
                      {p.ingredients.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <IconArrow className="text-[var(--t3)]" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/plats/nouveau"
        aria-label="Nouveau plat"
        className="fixed md:absolute bottom-[96px] md:bottom-8 right-5 w-[52px] h-[52px] rounded-2xl bg-[var(--t1)] text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform z-30"
      >
        <IconPlus />
      </Link>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-2.5 px-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3.5 p-3 bg-[var(--surface)] rounded-2xl border border-[var(--border)] animate-pulse"
        >
          <div className="w-16 h-16 rounded-xl bg-[var(--border-soft)]" />
          <div className="flex-1 space-y-2">
            <div className="h-2 w-12 bg-[var(--border)] rounded" />
            <div className="h-3 w-40 bg-[var(--border)] rounded" />
            <div className="h-2 w-24 bg-[var(--border-soft)] rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}
