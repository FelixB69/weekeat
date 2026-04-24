"use client";

import Link from "next/link";
import { useMemo } from "react";
import { JOURS_FR, JOURS_SHORT } from "@/lib/utils";
import { CATEGORIE_EMOJIS } from "@/lib/utils";
import type {
  JourSemaine,
  PlanningComplet,
  PlatWithIngredients,
  PlanningRepasWithPlat,
} from "@/lib/types/database.types";

interface DashboardProps {
  displayName: string;
  plats: PlatWithIngredients[];
  planning: PlanningComplet | null;
}

function dayOfWeek(): JourSemaine {
  const idx = (new Date().getDay() + 6) % 7;
  return JOURS_FR[idx] as JourSemaine;
}

function todayMeals(planning: PlanningComplet | null) {
  if (!planning) return { midi: null, soir: null };
  const today = dayOfWeek();
  const all = (planning.repas ?? []) as PlanningRepasWithPlat[];
  return {
    midi: all.find((r) => r.jour === today && r.moment === "midi") ?? null,
    soir: all.find((r) => r.jour === today && r.moment === "soir") ?? null,
  };
}

export function Dashboard({ displayName, plats, planning }: DashboardProps) {
  const { midi, soir } = useMemo(() => todayMeals(planning), [planning]);
  const today = dayOfWeek();

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="anim-fadeUp pb-6">
      {/* Header */}
      <header className="px-6 pt-6 flex items-start justify-between">
        <div>
          <div className="eyebrow capitalize">{dateLabel}</div>
          <h1 className="display-xl mt-1">
            Bonjour,
            <br />
            <em className="not-italic text-[var(--accent)] font-display italic">
              {displayName}.
            </em>
          </h1>
        </div>
        <Link
          href="/profil"
          aria-label="Mon profil"
          className="w-10 h-10 rounded-full bg-[var(--t1)] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 mt-1"
        >
          {displayName[0]?.toUpperCase()}
        </Link>
      </header>

      {/* Today */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--accent)]">
          Aujourd&apos;hui
        </span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      {!midi && !soir ? (
        <div className="px-6">
          <div className="border border-[var(--border)] border-dashed rounded-2xl px-5 py-8 text-center">
            <p className="text-sm text-[var(--t2)] mb-3">
              Pas encore de planning pour la semaine.
            </p>
            <Link href="/planning" className="btn btn-secondary">
              Générer mon planning
            </Link>
          </div>
        </div>
      ) : (
        <>
          {midi?.plat && <MealCard moment="Midi" plat={midi.plat} variant="light" />}
          {soir?.plat && <MealCard moment="Soir" plat={soir.plat} variant="dark" />}
        </>
      )}

      {/* Week strip */}
      <section className="px-6 pt-6">
        <div className="flex items-center justify-between mb-3.5">
          <span className="font-sans text-[15px] font-bold text-[var(--t1)]">
            Cette semaine
          </span>
          <Link
            href="/planning"
            className="text-xs font-bold text-[var(--accent)]"
          >
            Planning complet
          </Link>
        </div>
        <ul className="flex gap-2">
          {JOURS_FR.map((day) => {
            const isToday = day === today;
            const hasMidi = (planning?.repas ?? []).some(
              (r) => r.jour === day && r.moment === "midi" && r.plat
            );
            const hasSoir = (planning?.repas ?? []).some(
              (r) => r.jour === day && r.moment === "soir" && r.plat
            );
            return (
              <li key={day} className="flex-1">
                <Link
                  href="/planning"
                  className={
                    "flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 transition-colors " +
                    (isToday
                      ? "bg-[var(--accent-soft)] border-[var(--accent)]"
                      : "bg-[var(--surface)] border-[var(--border)]")
                  }
                >
                  <span
                    className={
                      "text-[10px] font-bold uppercase tracking-wider " +
                      (isToday ? "text-[var(--accent)]" : "text-[var(--t3)]")
                    }
                  >
                    {JOURS_SHORT[day]}
                  </span>
                  <span className="flex gap-[3px]">
                    <Dot active={hasMidi} color="accent" />
                    <Dot active={hasSoir} color="t2" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Shortcuts */}
      <section className="px-6 pt-6">
        <h2 className="font-sans text-[15px] font-bold text-[var(--t1)] mb-3">Raccourcis</h2>
        <div className="flex gap-2.5">
          <Shortcut
            href="/planning"
            title="Générer"
            sub="Nouveau planning"
            icon="➕"
            tone="accent"
          />
          <Shortcut
            href="/courses"
            title="Courses"
            sub="Ma liste"
            icon="✓"
            tone="green"
          />
          <Shortcut
            href="/plats"
            title="Plats"
            sub={`${plats.length} recettes`}
            icon="⊕"
            tone="muted"
          />
        </div>
      </section>
    </div>
  );
}

function MealCard({
  moment,
  plat,
  variant,
}: {
  moment: "Midi" | "Soir";
  plat: PlatWithIngredients;
  variant: "light" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <Link
      href="/planning"
      className={
        "mx-6 mb-2.5 rounded-2xl border p-4 flex items-center gap-3.5 transition-colors active:scale-[0.985] " +
        (isDark
          ? "bg-[var(--t1)] border-[var(--t1)] text-white"
          : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]")
      }
    >
      <div className="flex-1 min-w-0">
        <div
          className={
            "text-[10px] font-bold tracking-widest uppercase mb-1 " +
            (isDark ? "text-white/40" : "text-[var(--t3)]")
          }
        >
          {moment}
        </div>
        <div className="text-[16px] font-bold leading-tight truncate font-sans">
          {plat.nom}
        </div>
        <div
          className={
            "text-xs mt-1 " + (isDark ? "text-white/50" : "text-[var(--t2)]")
          }
        >
          {plat.temps_cuisson ? `${plat.temps_cuisson} min` : "—"}
        </div>
      </div>
      <div className="text-[44px] leading-none flex-shrink-0">
        {CATEGORIE_EMOJIS[plat.categorie]}
      </div>
    </Link>
  );
}

function Dot({
  active,
  color,
}: {
  active: boolean;
  color: "accent" | "t2";
}) {
  return (
    <span
      className={
        "w-[5px] h-[5px] rounded-full " +
        (active
          ? color === "accent"
            ? "bg-[var(--accent)]"
            : "bg-[var(--t2)]"
          : "bg-[var(--border)]")
      }
    />
  );
}

function Shortcut({
  href,
  title,
  sub,
  icon,
  tone,
}: {
  href: string;
  title: string;
  sub: string;
  icon: string;
  tone: "accent" | "green" | "muted";
}) {
  const bg =
    tone === "accent"
      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
      : tone === "green"
        ? "bg-[var(--green-soft)] text-[var(--green)]"
        : "bg-[var(--border-soft)] text-[var(--t2)]";
  return (
    <Link
      href={href}
      className="flex-1 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 transition-colors active:scale-[0.97] active:border-[var(--accent)]"
    >
      <div
        className={
          "w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 text-lg " + bg
        }
      >
        {icon}
      </div>
      <div className="text-[13px] font-bold text-[var(--t1)]">{title}</div>
      <div className="text-[11px] text-[var(--t3)] mt-0.5">{sub}</div>
    </Link>
  );
}
