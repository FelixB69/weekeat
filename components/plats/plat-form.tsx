"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CATEGORIES, UNITES, platSchema, type PlatInput } from "@/lib/schemas/plat";
import { CATEGORIE_LABELS, UNITE_LABELS, cn } from "@/lib/utils";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { useCreatePlat, useUpdatePlat, useDeletePlat } from "@/lib/hooks/use-plats";
import { uploadPlatPhoto } from "@/app/(app)/plats/actions";
import type { PlatWithIngredients } from "@/lib/types/database.types";

interface PlatFormProps {
  mode: "create" | "edit";
  initial?: PlatWithIngredients;
}

export function PlatForm({ mode, initial }: PlatFormProps) {
  const router = useRouter();
  const toast = useToast();
  const create = useCreatePlat();
  const update = useUpdatePlat(initial?.id ?? "");
  const del = useDeletePlat();
  const [uploading, setUploading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlatInput>({
    resolver: zodResolver(platSchema),
    defaultValues: {
      nom: initial?.nom ?? "",
      temps_cuisson: initial?.temps_cuisson ?? undefined,
      categorie: initial?.categorie ?? "autre",
      photo_url: initial?.photo_url ?? null,
      ingredients: initial?.ingredients?.map((i) => ({
        id: i.id,
        nom: i.nom,
        quantite: i.quantite ?? undefined,
        unite: i.unite,
      })) ?? [{ nom: "", quantite: undefined, unite: "autre" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "ingredients" });
  const photoUrl = watch("photo_url");

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const url = await uploadPlatPhoto(fd);
      setValue("photo_url", url);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload échoué");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: PlatInput) => {
    try {
      if (mode === "create") {
        await create.mutateAsync(values);
        toast.show("Plat ajouté !");
      } else {
        await update.mutateAsync(values);
        toast.show("Plat mis à jour !");
      }
      router.push("/plats");
      router.refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Erreur serveur");
    }
  };

  const onDelete = async () => {
    if (!initial) return;
    if (!confirm("Supprimer ce plat définitivement ?")) return;
    try {
      await del.mutateAsync(initial.id);
      toast.show("Plat supprimé.");
      router.push("/plats");
      router.refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <form
      className="flex flex-col gap-4 px-6"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {/* Photo */}
      <div>
        <label className="input-label">Photo</label>
        <div
          className={cn(
            "h-40 rounded-2xl border border-dashed border-[var(--border)] flex items-center justify-center relative overflow-hidden bg-[var(--surface)]",
            uploading && "opacity-60"
          )}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[var(--t3)] text-sm">
              {uploading ? "Envoi…" : "Déposer ou choisir une image"}
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={onPickPhoto}
            disabled={uploading}
          />
        </div>
      </div>

      {/* Nom */}
      <div>
        <label className="input-label" htmlFor="nom">
          Nom du plat
        </label>
        <input
          id="nom"
          className="input"
          placeholder="Poulet rôti"
          {...register("nom")}
        />
        {errors.nom && <p className="input-error">{errors.nom.message}</p>}
      </div>

      {/* Temps + catégorie */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label" htmlFor="temps">
            Temps (min)
          </label>
          <input
            id="temps"
            type="number"
            min={0}
            max={600}
            className="input"
            placeholder="45"
            {...register("temps_cuisson", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="input-label" htmlFor="categorie">
            Catégorie
          </label>
          <select
            id="categorie"
            className="input appearance-none"
            {...register("categorie")}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORIE_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ingrédients */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="input-label !mb-0">Ingrédients</span>
          <button
            type="button"
            onClick={() => append({ nom: "", quantite: undefined, unite: "autre" })}
            className="text-[12px] font-bold text-[var(--accent)] flex items-center gap-1"
          >
            <IconPlus size={14} />
            Ajouter
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {fields.map((f, idx) => (
            <li
              key={f.id}
              className="grid grid-cols-[1fr_80px_80px_auto] gap-2 items-start"
            >
              <input
                className="input py-2.5"
                placeholder="Ingrédient"
                {...register(`ingredients.${idx}.nom` as const)}
              />
              <input
                className="input py-2.5"
                type="number"
                step="0.1"
                placeholder="Qté"
                {...register(`ingredients.${idx}.quantite` as const, {
                  valueAsNumber: true,
                })}
              />
              <select
                className="input py-2.5 pr-2 appearance-none"
                {...register(`ingredients.${idx}.unite` as const)}
              >
                {UNITES.map((u) => (
                  <option key={u} value={u}>
                    {UNITE_LABELS[u] || "—"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label="Retirer"
                className="btn-icon"
              >
                <IconTrash size={16} />
              </button>
            </li>
          ))}
        </ul>
        {errors.ingredients && (
          <p className="input-error">
            Vérifiez les ingrédients (nom requis sur chaque ligne).
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="spinner" />
          ) : mode === "create" ? (
            "Ajouter le plat"
          ) : (
            "Enregistrer"
          )}
        </button>
        {mode === "edit" && (
          <button type="button" className="btn btn-danger w-full" onClick={onDelete}>
            <IconTrash size={16} /> Supprimer ce plat
          </button>
        )}
      </div>
    </form>
  );
}
