import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mondayOf, formatWeekRangeFr } from "@/lib/utils";
import { buildShoppingList } from "@/lib/planning/shopping-list";
import { CoursesView } from "@/components/courses/courses-view";
import type { PlanningComplet } from "@/lib/types/database.types";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  const supabase = await createClient();
  const weekStart = mondayOf();
  const { data } = await supabase
    .from("plannings")
    .select("*, repas:planning_repas(*, plat:plats(*, ingredients(*)))")
    .eq("semaine_debut", weekStart)
    .maybeSingle();

  const planning = (data ?? null) as PlanningComplet | null;
  const groups = buildShoppingList(planning);

  if (groups.length === 0) {
    return (
      <div className="anim-fadeUp pb-8">
        <header className="px-6 pt-6">
          <h1 className="display-lg">Courses</h1>
          <p className="text-[13px] text-[var(--t2)] mt-1">
            Semaine du {formatWeekRangeFr(weekStart)}
          </p>
        </header>
        <div className="px-6 py-14 text-center flex flex-col items-center gap-3">
          <div className="text-4xl opacity-40">🛒</div>
          <div className="font-sans text-[17px] font-bold text-[var(--t2)]">
            Aucun ingrédient pour l&apos;instant
          </div>
          <p className="text-[13px] text-[var(--t3)] max-w-xs leading-relaxed">
            Créez ou générez un planning pour voir votre liste de courses apparaître ici.
          </p>
          <Link href="/planning" className="btn btn-secondary mt-2">
            Aller au planning
          </Link>
        </div>
      </div>
    );
  }

  return <CoursesView weekStart={weekStart} groups={groups} />;
}
