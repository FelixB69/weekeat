import { createClient } from "@/lib/supabase/server";
import { ProfileView } from "@/components/profile/profile-view";
import { mondayOf } from "@/lib/utils";

export const metadata = { title: "Profil" };

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { count: platsCount }, { count: planningsCount }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
      supabase.from("plats").select("*", { count: "exact", head: true }),
      supabase.from("plannings").select("*", { count: "exact", head: true }),
    ]);

  return (
    <ProfileView
      email={user!.email ?? ""}
      displayName={(profile as { display_name: string | null } | null)?.display_name ?? user!.email?.split("@")[0] ?? "Marie"}
      platsCount={platsCount ?? 0}
      planningsCount={planningsCount ?? 0}
      currentWeek={mondayOf()}
    />
  );
}
