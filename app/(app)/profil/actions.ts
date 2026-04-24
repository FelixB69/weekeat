"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(displayName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const trimmed = displayName.trim().slice(0, 80);
  if (trimmed.length < 2) throw new Error("Nom trop court");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", user.id) as { error: { message: string } | null };
  if (error) throw new Error(error.message);
  revalidatePath("/profil");
  revalidatePath("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
