import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { JourSemaine, PlatCategorie, IngredientUnite } from "@/lib/types/database.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const JOURS_FR: JourSemaine[] = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

export const JOURS_SHORT: Record<JourSemaine, string> = {
  lundi: "Lun",
  mardi: "Mar",
  mercredi: "Mer",
  jeudi: "Jeu",
  vendredi: "Ven",
  samedi: "Sam",
  dimanche: "Dim",
};

export const JOURS_FULL: Record<JourSemaine, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

export const CATEGORIE_LABELS: Record<PlatCategorie, string> = {
  viande: "Viande",
  poisson: "Poisson",
  vegetarien: "Végétarien",
  vegan: "Vegan",
  soupe: "Soupe",
  pates: "Pâtes",
  autre: "Autre",
};

export const CATEGORIE_EMOJIS: Record<PlatCategorie, string> = {
  viande: "🍗",
  poisson: "🐟",
  vegetarien: "🥗",
  vegan: "🌱",
  soupe: "🍲",
  pates: "🍝",
  autre: "🍽️",
};

export const UNITE_LABELS: Record<IngredientUnite, string> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  L: "L",
  piece: "pièce",
  cas: "c.à.s",
  cac: "c.à.c",
  autre: "",
};

/** Returns the Monday of the week containing `date` (local time), formatted as YYYY-MM-DD. */
export function mondayOf(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatWeekRangeFr(monday: string): string {
  const start = new Date(monday);
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);
  const sMonth = start.toLocaleDateString("fr-FR", { month: "short" });
  const eMonth = end.toLocaleDateString("fr-FR", { month: "short" });
  if (sMonth === eMonth) {
    return `${start.getDate()} – ${end.getDate()} ${eMonth}`;
  }
  return `${start.getDate()} ${sMonth} – ${end.getDate()} ${eMonth}`;
}

export function formatQuantite(q: number | null, unite: IngredientUnite): string {
  if (q == null) return UNITE_LABELS[unite] || "";
  const display = Number.isInteger(q) ? String(q) : q.toString().replace(".", ",");
  const u = UNITE_LABELS[unite];
  return u ? `${display} ${u}`.trim() : display;
}
