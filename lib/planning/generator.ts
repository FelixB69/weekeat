import type {
  JourSemaine,
  MomentRepas,
  PlanningMode,
  PlatWithIngredients,
} from "@/lib/types/database.types";
import { JOURS_FR } from "@/lib/utils";

export interface RepasSlot {
  jour: JourSemaine;
  moment: MomentRepas;
  plat: PlatWithIngredients | null;
  verrouille: boolean;
}

export function emptyWeek(): RepasSlot[] {
  return JOURS_FR.flatMap((jour) =>
    (["midi", "soir"] as MomentRepas[]).map((moment) => ({
      jour,
      moment,
      plat: null,
      verrouille: false,
    }))
  );
}

/**
 * Génère un planning sans répétitions lorsque le stock le permet.
 * - Conserve les slots verrouillés tels quels.
 * - Sélectionne aléatoirement sans remise tant que le pool n'est pas épuisé.
 * - Utilise tous les plats disponibles si la semaine demande plus que le pool.
 */
export function generatePlanning(
  current: RepasSlot[],
  plats: PlatWithIngredients[],
  mode: PlanningMode
): RepasSlot[] {
  if (plats.length === 0) return current.map((s) => ({ ...s, plat: null }));

  const lockedPlatIds = new Set(
    current.filter((s) => s.verrouille && s.plat).map((s) => s.plat!.id)
  );

  const shuffled = shuffle(plats.filter((p) => !lockedPlatIds.has(p.id)));
  let pool = [...shuffled];

  const pick = (): PlatWithIngredients => {
    if (pool.length === 0) pool = shuffle(plats);
    return pool.shift()!;
  };

  return current.map((slot) => {
    const shouldHave =
      mode === "midi_soir" ||
      (mode === "midi" && slot.moment === "midi") ||
      (mode === "soir" && slot.moment === "soir");
    if (!shouldHave) return { ...slot, plat: null };
    if (slot.verrouille && slot.plat) return slot;
    return { ...slot, plat: pick() };
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
