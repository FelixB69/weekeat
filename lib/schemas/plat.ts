import { z } from "zod";

export const CATEGORIES = [
  "viande",
  "poisson",
  "vegetarien",
  "vegan",
  "soupe",
  "pates",
  "autre",
] as const;

export const UNITES = [
  "g",
  "kg",
  "ml",
  "L",
  "piece",
  "cas",
  "cac",
  "autre",
] as const;

export const ingredientSchema = z.object({
  id: z.string().uuid().optional(),
  nom: z.string().trim().min(1, "Nom requis").max(120),
  quantite: z
    .union([z.number().nonnegative(), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? null : v)),
  unite: z.enum(UNITES).default("autre"),
});

export const platSchema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(120),
  temps_cuisson: z
    .union([z.number().int().min(0).max(600), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? null : v)),
  categorie: z.enum(CATEGORIES).default("autre"),
  photo_url: z.string().url().nullable().optional(),
  ingredients: z.array(ingredientSchema).default([]),
});

export type PlatInput = z.infer<typeof platSchema>;
export type IngredientInput = z.infer<typeof ingredientSchema>;
