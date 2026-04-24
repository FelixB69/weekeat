import { PlanningView } from "@/components/planning/planning-view";
import { createClient } from "@/lib/supabase/server";
import { getPlanningForWeek, listPlannings } from "./actions";
import { mondayOf } from "@/lib/utils";
import type {
  PlanningComplet,
  PlatWithIngredients,
} from "@/lib/types/database.types";

export const metadata = { title: "Planning" };

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ semaine?: string }>;
}) {
  const { semaine } = await searchParams;
  const weekStart = semaine ? mondayOf(new Date(semaine + "T12:00:00")) : mondayOf();

  const supabase = await createClient();
  const [{ data: plats }, planning, pastPlannings] = await Promise.all([
    supabase.from("plats").select("*, ingredients(*)").order("nom"),
    getPlanningForWeek(weekStart),
    listPlannings(),
  ]);

  return (
    <PlanningView
      key={weekStart}
      weekStart={weekStart}
      plats={(plats ?? []) as PlatWithIngredients[]}
      initialPlanning={planning as PlanningComplet}
      pastPlannings={pastPlannings}
    />
  );
}
