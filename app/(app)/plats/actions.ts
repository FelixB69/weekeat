"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { platSchema, type PlatInput } from "@/lib/schemas/plat";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createPlat(input: PlatInput) {
  const parsed = platSchema.parse(input);
  const { supabase, user } = await requireUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: plat, error } = (await sb
    .from("plats")
    .insert({
      user_id: user.id,
      nom: parsed.nom,
      temps_cuisson: parsed.temps_cuisson,
      categorie: parsed.categorie,
      photo_url: parsed.photo_url ?? null,
    })
    .select()
    .single()) as { data: { id: string } | null; error: { message: string } | null };
  if (error) throw new Error(error.message);
  if (!plat) throw new Error("Plat introuvable après insert");

  if (parsed.ingredients.length > 0) {
    const { error: ingError } = (await sb.from("ingredients").insert(
      parsed.ingredients.map((i) => ({
        plat_id: plat.id,
        nom: i.nom,
        quantite: i.quantite,
        unite: i.unite,
      }))
    )) as { error: { message: string } | null };
    if (ingError) throw new Error(ingError.message);
  }

  revalidatePath("/plats");
  revalidatePath("/");
  return plat;
}

export async function updatePlat(id: string, input: PlatInput) {
  const parsed = platSchema.parse(input);
  const { supabase } = await requireUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { error } = (await sb
    .from("plats")
    .update({
      nom: parsed.nom,
      temps_cuisson: parsed.temps_cuisson,
      categorie: parsed.categorie,
      photo_url: parsed.photo_url ?? null,
    })
    .eq("id", id)) as { error: { message: string } | null };
  if (error) throw new Error(error.message);

  const { error: delErr } = (await sb.from("ingredients").delete().eq("plat_id", id)) as { error: { message: string } | null };
  if (delErr) throw new Error(delErr.message);

  if (parsed.ingredients.length > 0) {
    const { error: ingError } = (await sb.from("ingredients").insert(
      parsed.ingredients.map((i) => ({
        plat_id: id,
        nom: i.nom,
        quantite: i.quantite,
        unite: i.unite,
      }))
    )) as { error: { message: string } | null };
    if (ingError) throw new Error(ingError.message);
  }

  revalidatePath("/plats");
  revalidatePath(`/plats/${id}`);
  revalidatePath("/");
}

export async function deletePlat(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("plats").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/plats");
  revalidatePath("/");
}

export async function uploadPlatPhoto(formData: FormData): Promise<string> {
  const { supabase, user } = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Fichier invalide");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("plats-photos").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("plats-photos").getPublicUrl(path);
  return data.publicUrl;
}
