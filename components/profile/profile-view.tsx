"use client";

import { useState, useTransition } from "react";
import { Toggle } from "@/components/ui/toggle";
import { IconBell, IconLogout, IconMoon, IconSun, IconChevron } from "@/components/ui/icons";
import { useUIStore } from "@/lib/stores/ui-store";
import { signOut, updateDisplayName } from "@/app/(app)/profil/actions";
import { useToast } from "@/components/ui/toast";

interface ProfileViewProps {
  email: string;
  displayName: string;
  platsCount: number;
  planningsCount: number;
  currentWeek: string;
}

export function ProfileView({
  email,
  displayName,
  platsCount,
  planningsCount,
}: ProfileViewProps) {
  const toast = useToast();
  const { darkMode, notifications, reminders, setDarkMode, setNotifications, setReminders } =
    useUIStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName);
  const [, startTransition] = useTransition();

  const saveName = () => {
    startTransition(() => {
      updateDisplayName(name)
        .then(() => {
          setEditing(false);
          toast.show("Profil mis à jour !");
        })
        .catch((e: unknown) => {
          toast.show(e instanceof Error ? e.message : "Erreur");
        });
    });
  };

  return (
    <div className="anim-fadeUp pb-8">
      <header className="px-6 pt-7 pb-5 border-b border-[var(--border)]">
        <div className="w-[72px] h-[72px] rounded-full bg-[var(--t1)] text-white flex items-center justify-center font-display text-[28px] font-bold mb-3.5">
          {displayName[0]?.toUpperCase()}
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              className="input py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <button className="btn btn-secondary" onClick={saveName}>
              OK
            </button>
          </div>
        ) : (
          <h1 className="display-md">{displayName}</h1>
        )}
        <p className="text-[13px] text-[var(--t2)] mt-1">{email}</p>
        <div className="flex gap-2 mt-3">
          <span className="badge badge-muted">Plan Gratuit</span>
          <span className="badge badge-green">Vérifié</span>
        </div>
      </header>

      <div className="flex gap-2.5 px-5 py-4">
        <Stat label="Plats" value={String(platsCount)} />
        <Stat label="Plannings" value={String(planningsCount)} />
        <Stat label="Semaines" value="3" />
      </div>

      <div className="px-5">
        <h2 className="text-[11px] font-bold tracking-widest uppercase text-[var(--t3)] pt-4 pb-2">
          Préférences
        </h2>
        <SettingsRow
          icon={<IconMoon />}
          label="Mode sombre"
          trailing={
            <Toggle
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              label="Mode sombre"
            />
          }
        />
        <SettingsRow
          icon={<IconBell />}
          label="Notifications"
          trailing={
            <Toggle
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
              label="Notifications"
            />
          }
        />
        <SettingsRow
          icon={<IconSun />}
          label="Rappels repas"
          trailing={
            <Toggle
              checked={reminders}
              onChange={() => setReminders(!reminders)}
              label="Rappels repas"
            />
          }
        />
      </div>

      <div className="px-5">
        <h2 className="text-[11px] font-bold tracking-widest uppercase text-[var(--t3)] pt-5 pb-2">
          Compte
        </h2>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center justify-between w-full py-3 border-b border-[var(--border-soft)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-[var(--border-soft)] flex items-center justify-center text-[var(--t2)]">
              ✎
            </div>
            <span className="text-sm font-medium text-[var(--t1)]">Modifier le nom</span>
          </div>
          <IconChevron className="text-[var(--t3)]" />
        </button>
      </div>

      <div className="px-5 pt-4">
        <form action={signOut}>
          <button type="submit" className="btn btn-danger w-full">
            <IconLogout /> Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-3 text-center">
      <div className="font-display text-[22px] font-bold text-[var(--accent)] leading-none">
        {value}
      </div>
      <div className="text-[11px] text-[var(--t3)] mt-1.5 font-semibold">{label}</div>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  trailing: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border-soft)] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-[var(--border-soft)] flex items-center justify-center text-[var(--t2)]">
          {icon}
        </div>
        <span className="text-sm font-medium text-[var(--t1)]">{label}</span>
      </div>
      {trailing}
    </div>
  );
}
