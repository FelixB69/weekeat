"use client";

import { formatItemQty, type ShoppingGroup } from "@/lib/planning/shopping-list";

interface ExportArgs {
  weekRange: string;
  groups: ShoppingGroup[];
}

export async function exportCoursesPDF({ weekRange, groups }: ExportArgs) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const left = 48;
  let y = 64;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(10, 9, 8);
  doc.text("Liste de courses", left, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(107, 100, 96);
  doc.text(`Semaine du ${weekRange}`, left, y);
  y += 10;

  doc.setDrawColor(229, 225, 221);
  doc.line(left, y, pageWidth - left, y);
  y += 24;

  groups.forEach((g) => {
    if (y > pageHeight - 80) {
      doc.addPage();
      y = 64;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(171, 165, 161);
    doc.text(g.categorie.toUpperCase(), left, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(10, 9, 8);
    g.items.forEach((item) => {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 64;
      }
      const qty = formatItemQty(item);
      doc.setDrawColor(229, 225, 221);
      doc.rect(left, y - 10, 10, 10);
      doc.text(item.nom, left + 20, y - 1);
      if (qty) {
        doc.setTextColor(107, 100, 96);
        doc.text(qty, pageWidth - left, y - 1, { align: "right" });
        doc.setTextColor(10, 9, 8);
      }
      y += 18;
    });
    y += 10;
  });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(171, 165, 161);
  doc.text("Généré avec Weekeat", left, pageHeight - 32);

  doc.save(`weekeat-courses-${weekRange.replace(/\s+/g, "-")}.pdf`);
}
