"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  JourSemaine,
  MomentRepas,
  PlanningMode,
} from "@/lib/types/database.types";

interface RepasInput {
  plat_id: string | null;
  jour: JourSemaine;
  moment: MomentRepas;
  verrouille: boolean;
}

interface UpsertPlanningArgs {
  semaine_debut: string;
  mode: PlanningMode;
  repas: RepasInput[];
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function upsertPlanning(args: UpsertPlanningArgs) {
  const { supabase, user } = await requireUser();

  const { data: planning, error } = await supabase
    .from("plannings")
    .upsert(
      {
        user_id: user.id,
        semaine_debut: args.semaine_debut,
        mode: args.mode,
      },
      { onConflict: "user_id,semaine_debut" }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("planning_repas").delete().eq("planning_id", planning.id);

  const rows = args.repas.map((r) => ({
    planning_id: planning.id,
    plat_id: r.plat_id,
    jour: r.jour,
    moment: r.moment,
    verrouille: r.verrouille,
  }));
  if (rows.length > 0) {
    const { error: rErr } = await supabase.from("planning_repas").insert(rows);
    if (rErr) throw new Error(rErr.message);
  }

  revalidatePath("/planning");
  revalidatePath("/");
  revalidatePath("/courses");
  return planning.id;
}

export async function listPlannings() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("plannings")
    .select("id, semaine_debut, mode, repas:planning_repas(plat_id)")
    .eq("user_id", user.id)
    .order("semaine_debut", { ascending: false })
    .limit(52);
  type Row = { id: string; semaine_debut: string; mode: string; repas: { plat_id: string | null }[] };
  return (data as Row[] ?? [])
    .filter((p) => p.repas.some((r) => r.plat_id !== null))
    .map(({ repas: _, ...p }) => p);
}

export async function getPlanningForWeek(semaine_debut: string) {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("plannings")
    .select("*, repas:planning_repas(*, plat:plats(*, ingredients(*)))")
    .eq("user_id", user.id)
    .eq("semaine_debut", semaine_debut)
    .maybeSingle();

  if (existing) return existing;

  // Retourne un planning virtuel vide (non persisté) pour éviter de polluer l'historique
  return {
    id: "",
    user_id: user.id,
    semaine_debut,
    mode: "midi_soir" as const,
    repas: [],
  };
}
