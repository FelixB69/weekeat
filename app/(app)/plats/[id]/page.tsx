import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlatForm } from "@/components/plats/plat-form";
import type { PlatWithIngredients } from "@/lib/types/database.types";

export default async function PlatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plats")
    .select("*, ingredients(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();
  const plat = data as PlatWithIngredients;

  return (
    <div className="anim-fadeUp pb-12">
      <header className="px-6 pt-6 mb-4">
        <div className="eyebrow text-[var(--accent)]">Modifier</div>
        <h1 className="display-lg mt-1">{plat.nom}</h1>
      </header>
      <PlatForm mode="edit" initial={plat} />
    </div>
  );
}
