"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CATEGORIE_EMOJIS,
  JOURS_FULL,
  cn,
  formatWeekRangeFr,
  addDays,
  mondayOf,
} from "@/lib/utils";
import { IconLock, IconChevron, IconClock, IconClose } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { upsertPlanning } from "@/app/(app)/planning/actions";
import { generatePlanning, type RepasSlot } from "@/lib/planning/generator";
import { JOURS_FR } from "@/lib/utils";
import type {
  JourSemaine,
  MomentRepas,
  PlanningMode,
  PlanningComplet,
  PlatWithIngredients,
} from "@/lib/types/database.types";

interface PastPlanning {
  id: string;
  semaine_debut: string;
  mode: string;
}

interface PlanningViewProps {
  weekStart: string;
  plats: PlatWithIngredients[];
  initialPlanning: PlanningComplet;
  pastPlannings: PastPlanning[];
}

function normalize(planning: PlanningComplet): RepasSlot[] {
  const map = new Map<string, RepasSlot>();
  JOURS_FR.forEach((jour) => {
    (["midi", "soir"] as MomentRepas[]).forEach((moment) => {
      map.set(`${jour}-${moment}`, { jour, moment, plat: null, verrouille: false });
    });
  });
  (planning.repas ?? []).forEach((r) => {
    map.set(`${r.jour}-${r.moment}`, {
      jour: r.jour,
      moment: r.moment,
      plat: r.plat,
      verrouille: r.verrouille,
    });
  });
  return Array.from(map.values());
}

const MODES: { k: PlanningMode; l: string }[] = [
  { k: "midi_soir", l: "Midi + Soir" },
  { k: "midi", l: "Midi" },
  { k: "soir", l: "Soir" },
];

export function PlanningView({ weekStart, plats, initialPlanning, pastPlannings }: PlanningViewProps) {
  const router = useRouter();
  const toast = useToast();

  const [mode, setMode] = useState<PlanningMode>(initialPlanning.mode);
  const [slots, setSlots] = useState<RepasSlot[]>(() => normalize(initialPlanning));
  // savedSlots mirrors what's in DB — used to detect dirty state and hasData
  const [savedSlots, setSavedSlots] = useState<RepasSlot[]>(() => normalize(initialPlanning));
  const [isDirty, setIsDirty] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ jour: JourSemaine; moment: MomentRepas } | null>(null);

  const currentWeekStart = mondayOf();
  const isCurrentWeek = weekStart === currentWeekStart;
  // hasData = planning has been saved to DB with at least one plat
  const hasData = savedSlots.some((s) => s.plat !== null);

  const navigate = (iso: string) => router.push(`/planning?semaine=${iso}`);

  const byDay = useMemo(() => {
    const out = new Map<JourSemaine, { midi: RepasSlot; soir: RepasSlot }>();
    JOURS_FR.forEach((jour) => {
      const midi = slots.find((s) => s.jour === jour && s.moment === "midi");
      const soir = slots.find((s) => s.jour === jour && s.moment === "soir");
      if (midi && soir) out.set(jour, { midi, soir });
    });
    return out;
  }, [slots]);

  const lockedDays = JOURS_FR.filter((d) => {
    const s = byDay.get(d);
    return s ? s.midi.verrouille || s.soir.verrouille : false;
  });

  const toggleLock = (jour: JourSemaine) => {
    setSlots((prev) => prev.map((s) => (s.jour === jour ? { ...s, verrouille: !s.verrouille } : s)));
    setIsDirty(true);
  };

  const onModeChange = (m: PlanningMode) => {
    setMode(m);
    setSlots((prev) =>
      prev.map((s) => {
        const keep =
          m === "midi_soir" ||
          (m === "midi" && s.moment === "midi") ||
          (m === "soir" && s.moment === "soir");
        return keep ? s : { ...s, plat: null };
      })
    );
    setIsDirty(true);
  };

  const onGenerate = async () => {
    if (plats.length === 0) {
      toast.show("Ajoutez d'abord quelques plats !");
      return;
    }
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 700));
    const next = generatePlanning(slots, plats, mode);
    setSlots(next);
    setIsDirty(true);
    setGenerating(false);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await upsertPlanning({
        semaine_debut: weekStart,
        mode,
        repas: slots.map((s) => ({
          jour: s.jour,
          moment: s.moment,
          plat_id: s.plat?.id ?? null,
          verrouille: s.verrouille,
        })),
      });
      setSavedSlots([...slots]);
      setIsDirty(false);
      toast.show("Planning enregistré !");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const onClear = async () => {
    const empty = slots.map((s) => ({ ...s, plat: null, verrouille: false }));
    setSaving(true);
    try {
      await upsertPlanning({
        semaine_debut: weekStart,
        mode,
        repas: empty.map((s) => ({
          jour: s.jour,
          moment: s.moment,
          plat_id: null,
          verrouille: false,
        })),
      });
      setSlots(empty);
      setSavedSlots(empty);
      setIsDirty(false);
      toast.show("Planning vidé.");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const onSelectPlat = (jour: JourSemaine, moment: MomentRepas, plat: PlatWithIngredients | null) => {
    setSlots((prev) =>
      prev.map((s) => (s.jour === jour && s.moment === moment ? { ...s, plat } : s))
    );
    setIsDirty(true);
    setEditingSlot(null);
  };

  const editingSlotData = editingSlot
    ? (slots.find((s) => s.jour === editingSlot.jour && s.moment === editingSlot.moment) ?? null)
    : null;

  const otherPlannings = pastPlannings.filter((p) => p.semaine_debut !== weekStart);
  const busy = generating || saving;

  return (
    <div className="anim-fadeUp pb-8">
      {editingSlot && (
        <PlatPicker
          plats={plats}
          currentPlat={editingSlotData?.plat ?? null}
          label={`${JOURS_FULL[editingSlot.jour]} — ${editingSlot.moment === "midi" ? "Midi" : "Soir"}`}
          onSelect={(plat) => onSelectPlat(editingSlot.jour, editingSlot.moment, plat)}
          onClose={() => setEditingSlot(null)}
        />
      )}

      <header className="px-6 pt-6">
        <h1 className="display-lg">Planning</h1>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => navigate(addDays(weekStart, -7))}
            aria-label="Semaine précédente"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--border-soft)] transition-colors active:scale-90"
          >
            <IconChevron size={18} className="-rotate-180" />
          </button>
          <div className="flex-1 text-center">
            <span className={cn(
              "text-[13px] font-semibold",
              isCurrentWeek ? "text-[var(--accent)]" : "text-[var(--t2)]"
            )}>
              {isCurrentWeek ? "Cette semaine" : `Semaine du ${formatWeekRangeFr(weekStart)}`}
            </span>
            {!isCurrentWeek && (
              <button
                onClick={() => navigate(currentWeekStart)}
                className="block mx-auto text-[11px] text-[var(--accent)] font-bold mt-0.5 active:opacity-70"
              >
                Revenir à maintenant
              </button>
            )}
          </div>
          <button
            onClick={() => navigate(addDays(weekStart, 7))}
            aria-label="Semaine suivante"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--border-soft)] transition-colors active:scale-90"
          >
            <IconChevron size={18} />
          </button>
        </div>
      </header>

      <div className="px-6 pt-4">
        <div
          role="tablist"
          aria-label="Mode de planning"
          className="flex bg-[var(--border-soft)] rounded-xl p-[3px] gap-[2px]"
        >
          {MODES.map(({ k, l }) => (
            <button
              key={k}
              role="tab"
              aria-selected={mode === k}
              onClick={() => onModeChange(k)}
              className={cn(
                "flex-1 rounded-[9px] px-2 py-2 font-sans text-xs font-bold transition-all",
                mode === k
                  ? "bg-[var(--surface)] text-[var(--t1)] shadow-sm"
                  : "text-[var(--t3)]"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-2 px-5 pt-4">
        {JOURS_FR.map((jour) => {
          const day = byDay.get(jour);
          if (!day) return null;
          const locked = day.midi.verrouille || day.soir.verrouille;
          return (
            <li
              key={jour}
              className={cn(
                "rounded-2xl border px-3.5 py-3 flex items-center gap-3 transition-colors",
                locked
                  ? "bg-[var(--accent-soft)] border-[var(--accent)]"
                  : "bg-[var(--surface)] border-[var(--border)]"
              )}
            >
              <div
                className={cn(
                  "font-sans text-xs font-bold min-w-7 uppercase tracking-wider",
                  locked ? "text-[var(--accent)]" : "text-[var(--t3)]"
                )}
              >
                {JOURS_FULL[jour].slice(0, 3)}
              </div>
              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                {mode !== "soir" && (
                  <Meal
                    slot={day.midi}
                    label="Midi"
                    onClick={() => setEditingSlot({ jour, moment: "midi" })}
                  />
                )}
                {mode !== "midi" && (
                  <Meal
                    slot={day.soir}
                    label="Soir"
                    onClick={() => setEditingSlot({ jour, moment: "soir" })}
                  />
                )}
              </div>
              <button
                onClick={() => toggleLock(jour)}
                aria-label={locked ? "Déverrouiller" : "Verrouiller"}
                aria-pressed={locked}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
              >
                <IconLock on={locked} />
              </button>
            </li>
          );
        })}
      </ul>

      {lockedDays.length > 0 && !hasData && (
        <div className="px-5 pt-3">
          <div className="bg-[var(--accent-soft)] text-[var(--accent)] rounded-xl px-3.5 py-2.5 text-[13px] font-bold">
            {lockedDays.length} jour{lockedDays.length > 1 ? "s" : ""} verrouillé
            {lockedDays.length > 1 ? "s" : ""} — les autres seront régénérés
          </div>
        </div>
      )}

      <div className="px-5 pt-5 sticky bottom-24 md:static flex flex-col gap-2">
        {/* Générer — uniquement si pas de planning enregistré et pas de modif en attente */}
        {!hasData && !isDirty && (
          <button
            onClick={onGenerate}
            disabled={busy}
            className="btn btn-primary w-full shadow-[0_4px_24px_rgba(233,43,198,0.3)]"
          >
            {generating ? (
              <><span className="spinner" /> Génération en cours…</>
            ) : (
              "Générer le planning"
            )}
          </button>
        )}

        {/* Régénérer — visible après génération si pas encore sauvegardé */}
        {!hasData && isDirty && (
          <button
            onClick={onGenerate}
            disabled={busy}
            className="btn w-full border border-[var(--border)] text-[var(--t2)] bg-transparent transition-colors"
          >
            {generating ? (
              <><span className="spinner" /> Génération en cours…</>
            ) : (
              "Régénérer"
            )}
          </button>
        )}

        {/* Enregistrer — dès qu'il y a des modifications non sauvegardées */}
        {isDirty && (
          <button
            onClick={onSave}
            disabled={busy}
            className="btn btn-primary w-full"
          >
            {saving ? (
              <><span className="spinner" /> Enregistrement…</>
            ) : (
              "Enregistrer le planning"
            )}
          </button>
        )}

        {/* Vider — uniquement si un planning est enregistré en DB */}
        {hasData && !isDirty && (
          <button
            onClick={onClear}
            disabled={busy}
            className="btn w-full border border-[var(--border)] text-[var(--t2)] bg-transparent hover:border-red-400 hover:text-red-500 transition-colors"
          >
            Vider le planning
          </button>
        )}

        {plats.length === 0 && (
          <p className="text-center text-[12px] text-[var(--t2)] mt-1">
            Ajoutez quelques plats d&apos;abord dans{" "}
            <Link href="/plats/nouveau" className="text-[var(--accent)] font-bold">
              Mes plats
            </Link>
            .
          </p>
        )}
      </div>

      {otherPlannings.length > 0 && (
        <div className="px-5 pt-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-[13px] font-bold text-[var(--t2)] hover:text-[var(--t1)] transition-colors w-full"
          >
            <IconClock size={14} />
            <span>
              Historique ({otherPlannings.length} semaine{otherPlannings.length > 1 ? "s" : ""})
            </span>
            <IconChevron
              size={14}
              className={cn("ml-auto transition-transform", showHistory ? "rotate-90" : "")}
            />
          </button>
          {showHistory && (
            <ul className="mt-2 flex flex-col gap-1">
              {otherPlannings.map((p) => {
                const isPast = p.semaine_debut < currentWeekStart;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => navigate(p.semaine_debut)}
                      className="w-full flex items-center justify-between rounded-xl px-3.5 py-3 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors active:scale-[0.98]"
                    >
                      <span className="text-[13px] font-semibold text-[var(--t1)]">
                        {formatWeekRangeFr(p.semaine_debut)}
                      </span>
                      <span className={cn(
                        "text-[11px] font-bold",
                        isPast ? "text-[var(--t3)]" : "text-[var(--accent)]"
                      )}>
                        {isPast ? "Passée" : "À venir"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Meal({
  slot,
  label,
  onClick,
}: {
  slot: RepasSlot;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 min-w-0 w-full text-left rounded-lg px-1 py-0.5 -mx-1 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
    >
      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--t3)] w-7 flex-shrink-0">
        {label}
      </span>
      {slot.plat ? (
        <>
          <span className="text-base flex-shrink-0">{CATEGORIE_EMOJIS[slot.plat.categorie]}</span>
          <span className="text-[13px] font-semibold text-[var(--t1)] truncate font-sans">
            {slot.plat.nom}
          </span>
        </>
      ) : (
        <span className="text-[13px] text-[var(--t3)] italic">—</span>
      )}
    </button>
  );
}

function PlatPicker({
  plats,
  currentPlat,
  label,
  onSelect,
  onClose,
}: {
  plats: PlatWithIngredients[];
  currentPlat: PlatWithIngredients | null;
  label: string;
  onSelect: (plat: PlatWithIngredients | null) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = plats.filter((p) =>
    p.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[var(--surface)] rounded-t-3xl max-h-[75vh] flex flex-col shadow-2xl">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[var(--border)]">
          <span className="font-bold text-[var(--t1)] text-[15px]">{label}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--t2)] hover:bg-[var(--border-soft)]"
          >
            <IconClose />
          </button>
        </div>
        <div className="px-4 py-2.5 border-b border-[var(--border)]">
          <input
            className="w-full bg-[var(--border-soft)] rounded-xl px-3 py-2 text-[13px] outline-none"
            placeholder="Rechercher un plat…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <ul className="overflow-y-auto flex-1 px-3 py-2">
          <li>
            <button
              onClick={() => onSelect(null)}
              className="w-full text-left px-3 py-2.5 rounded-xl text-[13px] text-[var(--t3)] italic hover:bg-[var(--border-soft)] transition-colors"
            >
              Retirer ce plat
            </button>
          </li>
          {filtered.map((plat) => (
            <li key={plat.id}>
              <button
                onClick={() => onSelect(plat)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors",
                  plat.id === currentPlat?.id
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "hover:bg-[var(--border-soft)] text-[var(--t1)]"
                )}
              >
                <span className="text-base">{CATEGORIE_EMOJIS[plat.categorie]}</span>
                <span className="text-[13px] font-semibold">{plat.nom}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-center text-[13px] text-[var(--t3)]">
              Aucun plat trouvé
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
