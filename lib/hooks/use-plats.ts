"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { PlatWithIngredients } from "@/lib/types/database.types";
import { platsStore } from "@/lib/offline/plats-store";
import { createPlat, deletePlat, updatePlat } from "@/app/(app)/plats/actions";
import type { PlatInput } from "@/lib/schemas/plat";

export const platsKey = ["plats"] as const;
export const platKey = (id: string) => ["plat", id] as const;

async function fetchPlats(): Promise<PlatWithIngredients[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("plats")
    .select("*, ingredients(*)")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const plats = (data ?? []) as PlatWithIngredients[];
  await platsStore.saveAll(plats);
  return plats;
}

export function usePlats() {
  return useQuery({
    queryKey: platsKey,
    queryFn: fetchPlats,
    initialData: () => undefined,
    placeholderData: (prev) => prev,
  });
}

export function usePlat(id: string | undefined) {
  return useQuery({
    queryKey: id ? platKey(id) : ["plat", "none"],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("plats")
        .select("*, ingredients(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as PlatWithIngredients | null;
    },
  });
}

export function useCreatePlat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlatInput) => createPlat(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: platsKey }),
  });
}

export function useUpdatePlat(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlatInput) => updatePlat(id, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: platsKey });
      const prev = qc.getQueryData<PlatWithIngredients[]>(platsKey);
      if (prev) {
        qc.setQueryData<PlatWithIngredients[]>(
          platsKey,
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  nom: input.nom,
                  temps_cuisson: input.temps_cuisson ?? null,
                  categorie: input.categorie,
                  photo_url: input.photo_url ?? null,
                }
              : p
          )
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(platsKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: platsKey });
      qc.invalidateQueries({ queryKey: platKey(id) });
    },
  });
}

export function useDeletePlat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePlat(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: platsKey });
      const prev = qc.getQueryData<PlatWithIngredients[]>(platsKey);
      if (prev) {
        qc.setQueryData<PlatWithIngredients[]>(
          platsKey,
          prev.filter((p) => p.id !== id)
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(platsKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: platsKey }),
  });
}
