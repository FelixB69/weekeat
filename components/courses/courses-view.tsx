"use client";

import { useMemo } from "react";
import { IconCheck, IconShare } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { useUIStore } from "@/lib/stores/ui-store";
import { formatWeekRangeFr, cn } from "@/lib/utils";
import { formatItemQty, type ShoppingGroup } from "@/lib/planning/shopping-list";
import { exportCoursesPDF } from "./export-pdf";

interface CoursesViewProps {
  weekStart: string;
  groups: ShoppingGroup[];
}

export function CoursesView({ weekStart, groups }: CoursesViewProps) {
  const toast = useToast();
  const checkedForWeek = useUIStore((s) => s.checkedItems[weekStart]);
  const checked = checkedForWeek ?? [];
  const toggle = useUIStore((s) => s.toggleChecked);

  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const pct = allItems.length
    ? Math.round((checked.length / allItems.length) * 100)
    : 0;

  const share = async () => {
    const text = buildShareText(groups);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Weekeat — Liste de courses",
          text,
        });
        return;
      }
    } catch {
      // fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.show("Liste copiée dans le presse-papier !");
    } catch {
      toast.show("Impossible de partager la liste");
    }
  };

  const onExport = () => {
    exportCoursesPDF({ weekRange: formatWeekRangeFr(weekStart), groups });
    toast.show("PDF généré !");
  };

  return (
    <div className="anim-fadeUp pb-8">
      <header className="px-6 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="display-lg">Courses</h1>
            <p className="text-[13px] text-[var(--t2)] mt-1">
              Semaine du {formatWeekRangeFr(weekStart)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onExport}
              aria-label="Exporter en PDF"
              className="btn-icon accent"
            >
              <span className="text-[13px] font-bold">PDF</span>
            </button>
            <button
              type="button"
              onClick={share}
              aria-label="Partager la liste"
              className="btn-icon accent"
            >
              <IconShare />
            </button>
          </div>
        </div>

        <div className="mt-4 h-1 rounded-full bg-[var(--border-soft)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-semibold">
          <span className="text-[var(--t2)]">
            {checked.length} / {allItems.length} articles
          </span>
          <span className="text-[var(--accent)] font-bold">{pct}%</span>
        </div>
      </header>

      <div className="px-5">
        {groups.map((g) => (
          <section key={g.categorie}>
            <h2 className="text-[11px] font-bold tracking-widest uppercase text-[var(--t3)] pt-5 pb-2">
              {g.categorie}
            </h2>
            <ul>
              {g.items.map((item) => {
                const isChecked = checked.includes(item.nom);
                return (
                  <li key={`${item.nom}|${item.unite}`}>
                    <button
                      type="button"
                      onClick={() => toggle(weekStart, item.nom)}
                      className="flex items-center gap-3 py-3 border-b border-[var(--border-soft)] w-full text-left"
                    >
                      <span
                        className={cn(
                          "w-[22px] h-[22px] rounded-[7px] border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors",
                          isChecked
                            ? "bg-[var(--green)] border-[var(--green)]"
                            : "border-[var(--border)]"
                        )}
                      >
                        {isChecked && <IconCheck className="text-white" />}
                      </span>
                      <span
                        className={cn(
                          "flex-1 text-sm font-medium text-[var(--t1)]",
                          isChecked && "line-through text-[var(--t3)]"
                        )}
                      >
                        {item.nom}
                      </span>
                      <span className="text-xs text-[var(--t2)] font-semibold">
                        {formatItemQty(item)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {checked.length === allItems.length && allItems.length > 0 && (
        <div className="mx-5 mt-6 bg-[var(--green-soft)] rounded-2xl p-5 text-center border border-[var(--green-soft)]">
          <div className="font-display font-bold text-lg text-[var(--green)]">
            Liste complète.
          </div>
          <p className="text-[13px] text-[var(--t2)] mt-1">Bonne course !</p>
        </div>
      )}
    </div>
  );
}

function buildShareText(groups: ShoppingGroup[]): string {
  const lines: string[] = ["🛒 Liste de courses — Weekeat", ""];
  groups.forEach((g) => {
    lines.push(`— ${g.categorie.toUpperCase()} —`);
    g.items.forEach((i) => {
      const qty = formatItemQty(i);
      lines.push(qty ? `• ${i.nom} (${qty})` : `• ${i.nom}`);
    });
    lines.push("");
  });
  return lines.join("\n");
}
