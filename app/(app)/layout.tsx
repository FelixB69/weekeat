import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav, Sidebar } from "@/components/layout/bottom-nav";
import { OfflineBadge } from "@/components/layout/offline-badge";
import { SyncBootstrap } from "@/components/offline/sync-bootstrap";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <Sidebar />
      <OfflineBadge />
      <SyncBootstrap />
      <main className="md:pl-64 pb-24 md:pb-8">
        <div className="mx-auto max-w-[560px] md:max-w-3xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
