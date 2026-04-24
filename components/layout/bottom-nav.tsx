"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  IconHome,
  IconDishes,
  IconPlan,
  IconShop,
  IconProfile,
} from "@/components/ui/icons";

const TABS = [
  { href: "/", label: "Accueil", Icon: IconHome, match: (p: string) => p === "/" },
  {
    href: "/plats",
    label: "Plats",
    Icon: IconDishes,
    match: (p: string) => p.startsWith("/plats"),
  },
  {
    href: "/planning",
    label: "Planning",
    Icon: IconPlan,
    match: (p: string) => p.startsWith("/planning"),
  },
  {
    href: "/courses",
    label: "Courses",
    Icon: IconShop,
    match: (p: string) => p.startsWith("/courses"),
  },
  {
    href: "/profil",
    label: "Profil",
    Icon: IconProfile,
    match: (p: string) => p.startsWith("/profil"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed bottom-0 inset-x-0 h-20 bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-around px-1 pb-safe z-40"
    >
      {TABS.map(({ href, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-xl",
              "text-[10px] font-semibold tracking-wide transition-colors",
              active ? "text-[var(--t1)]" : "text-[var(--t3)]"
            )}
          >
            <span
              className={cn(
                "absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)] transition-opacity",
                active ? "opacity-100" : "opacity-0"
              )}
            />
            <Icon
              size={22}
              className={cn(active ? "text-[var(--accent)]" : "text-current")}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-[var(--surface)] border-r border-[var(--border)] flex-col z-40">
      <div className="px-6 py-8">
        <Link href="/" className="inline-flex items-baseline gap-0.5">
          <span className="font-display text-3xl font-bold tracking-tight text-[var(--t1)]">
            Week
          </span>
          <span className="font-display text-3xl font-bold tracking-tight text-[var(--accent)]">
            eat
          </span>
        </Link>
      </div>
      <ul className="flex flex-col gap-1 px-3 flex-1">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--t2)] hover:bg-[var(--border-soft)]"
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="px-6 py-6 text-[11px] text-[var(--t3)] font-medium">Weekeat · 2026</div>
    </aside>
  );
}
