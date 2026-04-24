import type {
  IngredientUnite,
  PlanningComplet,
} from "@/lib/types/database.types";
import { UNITE_LABELS } from "@/lib/utils";

export interface ShoppingItem {
  nom: string;
  unite: IngredientUnite;
  quantite: number | null;
  // Pour les ingrédients sans quantité numérique, on agrège le nombre d'occurrences.
  occurrences: number;
}

export interface ShoppingGroup {
  categorie: string;
  items: ShoppingItem[];
}

const CATEGORY_BY_UNITE: Record<IngredientUnite, string> = {
  g: "Légumes & Fruits",
  kg: "Légumes & Fruits",
  ml: "Épicerie",
  L: "Épicerie",
  piece: "Légumes & Fruits",
  cas: "Épicerie",
  cac: "Épicerie",
  autre: "Autres",
};

export function formatItemQty(item: ShoppingItem): string {
  if (item.quantite == null) {
    return item.occurrences > 1 ? `×${item.occurrences}` : "";
  }
  const u = UNITE_LABELS[item.unite];
  const q = Number.isInteger(item.quantite)
    ? String(item.quantite)
    : item.quantite.toString().replace(".", ",");
  return u ? `${q} ${u}` : q;
}

/**
 * Agrège les ingrédients de tous les repas du planning :
 * - fusionne les doublons exacts (nom + unité)
 * - additionne les quantités
 * - regroupe par catégorie dérivée de l'unité (fallback "Autres")
 */
export function buildShoppingList(planning: PlanningComplet | null): ShoppingGroup[] {
  if (!planning) return [];
  const map = new Map<string, ShoppingItem>();

  (planning.repas ?? []).forEach((r) => {
    if (!r.plat) return;
    r.plat.ingredients?.forEach((ing) => {
      const key = `${ing.nom.toLowerCase().trim()}|${ing.unite}`;
      const existing = map.get(key);
      if (existing) {
        existing.occurrences++;
        if (ing.quantite != null) {
          existing.quantite = (existing.quantite ?? 0) + ing.quantite;
        }
      } else {
        map.set(key, {
          nom: ing.nom,
          unite: ing.unite,
          quantite: ing.quantite,
          occurrences: 1,
        });
      }
    });
  });

  const grouped = new Map<string, ShoppingItem[]>();
  for (const item of map.values()) {
    const cat = CATEGORY_BY_UNITE[item.unite];
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  return Array.from(grouped.entries())
    .map(([categorie, items]) => ({
      categorie,
      items: items.sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    }))
    .sort((a, b) => a.categorie.localeCompare(b.categorie, "fr"));
}
