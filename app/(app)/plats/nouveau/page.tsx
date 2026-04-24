import { PlatForm } from "@/components/plats/plat-form";

export const metadata = { title: "Nouveau plat" };

export default function NouveauPlatPage() {
  return (
    <div className="anim-fadeUp pb-12">
      <header className="px-6 pt-6 mb-4">
        <div className="eyebrow text-[var(--accent)]">Nouveau</div>
        <h1 className="display-lg mt-1">Ajouter un plat</h1>
        <p className="text-[13px] text-[var(--t2)] mt-1">
          Donnez-lui un nom, une photo et ses ingrédients.
        </p>
      </header>
      <PlatForm mode="create" />
    </div>
  );
}
