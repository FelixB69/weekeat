import { createClient } from "@/lib/supabase/server";
import { Dashboard } from "@/components/dashboard/dashboard";
import { mondayOf } from "@/lib/utils";
import type {
  PlanningComplet,
  PlatWithIngredients,
} from "@/lib/types/database.types";

export const metadata = { title: "Accueil" };

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: plats }, { data: planning }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
    supabase.from("plats").select("*, ingredients(*)").order("updated_at", { ascending: false }),
    supabase
      .from("plannings")
      .select("*, repas:planning_repas(*, plat:plats(*, ingredients(*)))")
      .eq("semaine_debut", mondayOf())
      .maybeSingle(),
  ]);

  return (
    <Dashboard
      displayName={profile?.display_name || user!.email?.split("@")[0] || "Marie"}
      plats={(plats ?? []) as PlatWithIngredients[]}
      planning={(planning ?? null) as PlanningComplet | null}
    />
  );
}
