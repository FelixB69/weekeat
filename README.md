# Weekeat

PWA de planification de repas — **Next.js 15**, **Supabase**, **Tailwind v4**.

Direction visuelle : **Editorial Épuré** — Playfair Display × Plus Jakarta Sans, accent magenta `#E92BC6`, surfaces oat-white, borders 1px, zéro gradient.

---

## Stack

| Couche | Techno |
| --- | --- |
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| Langage | TypeScript strict, `noUncheckedIndexedAccess` |
| Backend | Supabase (Postgres + Auth + Storage) |
| PWA | `@ducanh2912/next-pwa` + Workbox |
| Styling | Tailwind CSS v4 (via `@tailwindcss/postcss`) |
| State | Zustand (persist) + TanStack Query v5 |
| Offline | IndexedDB via `idb` + file de mutations |
| Formulaires | React Hook Form + Zod |
| Export | jsPDF |
| Partage | Web Share API (fallback presse-papier) |

---

## Démarrage local

```bash
# 1. Installer les deps
npm install

# 2. Créer un projet Supabase sur https://supabase.com/dashboard
#    Puis copier l'URL + anon key dans .env.local :
cp .env.local.example .env.local
# → renseigner NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Exécuter le schéma dans le SQL Editor Supabase :
#    copier-coller le contenu de supabase/schema.sql puis Run.

# 4. Lancer le dev server
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

> Le mode dev désactive le Service Worker. Pour tester la PWA en local, builder puis démarrer : `npm run build && npm start`.

---

## Architecture

```
app/
  (auth)/              → login / register (publiques)
  (app)/               → routes protégées par le middleware Supabase
    layout.tsx         → Sidebar desktop + BottomNav mobile + offline bootstrap
    page.tsx           → Dashboard (SSR)
    plats/
      page.tsx         → Liste + filtres (client, TanStack Query)
      nouveau/page.tsx → Formulaire de création
      [id]/page.tsx    → Édition + suppression
      actions.ts       → Server Actions CRUD + upload photo
    planning/
      page.tsx         → Vue semaine (lundi→dimanche), verrouillage, générateur
      actions.ts       → Upsert planning + repas
    courses/page.tsx   → Liste agrégée, PDF, Web Share
    profil/page.tsx    → Stats, toggles, signOut
  auth/callback        → Échange du code OTP Supabase
  globals.css          → Design tokens + composants utilitaires

components/
  dashboard/           → Hero + week strip + shortcuts
  plats/               → Formulaire + liste + FAB
  planning/            → Grille semaine + pill group + lock
  courses/             → Liste + export PDF + barre progression
  profile/             → Réglages + déconnexion
  layout/              → BottomNav, Sidebar, OfflineBadge
  offline/             → Sync bootstrap (replay file d'attente)
  providers/           → QueryClient + ToastProvider
  ui/                  → Icons, Toggle, Toast

lib/
  supabase/            → client (browser), server (RSC), middleware (SSR cookies)
  stores/              → Zustand (UI prefs, network status)
  offline/             → idb schema + queue + plats store
  planning/            → Générateur + agrégateur liste de courses
  schemas/             → Zod pour plats + ingrédients
  hooks/               → useAuth, usePlats (TanStack Query)
  types/               → database.types.ts (miroir SQL)
  utils.ts             → dates, enums, helpers

supabase/
  schema.sql           → Tables + enums + triggers + RLS + storage bucket

public/
  manifest.json        → PWA manifest
  icons/               → Placeholder — voir icons/README.md
```

---

## Sécurité

- **RLS activée sur toutes les tables** — chaque utilisateur ne voit que ses plats, plannings et ingrédients.
- Les **ingrédients et repas** héritent de l'accès via leur parent (plat / planning).
- Le bucket Storage `plats-photos` est lisible publiquement mais seul le propriétaire peut uploader/modifier/supprimer ses propres fichiers (préfixe `{user_id}/`).
- La **service_role key** n'est jamais exposée côté client ; elle ne sert qu'aux scripts admin.

---

## Déploiement

### Supabase

1. Créer un projet sur [supabase.com](https://supabase.com/dashboard)
2. SQL Editor → coller tout `supabase/schema.sql` → Run
3. Authentication → Providers → Email (ON). Configurer le Site URL sur l'URL Vercel.
4. Authentication → URL Configuration → ajouter `{VERCEL_URL}/auth/callback` dans les Redirect URLs.

### Vercel

```bash
# Connecter le repo à Vercel, puis dans les Environment Variables :
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://weekeat.vercel.app
# (optionnel, pour scripts admin)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Vercel détecte automatiquement Next.js 15 — aucune config supplémentaire nécessaire.

### PWA

Après déploiement :
- Vérifier `/manifest.json` accessible
- Vérifier `/sw.js` généré par `next-pwa`
- Lighthouse PWA score cible : ≥ 90
- Remplacer les icônes dans `public/icons/` par les vraies (voir le README du dossier)

---

## Fonctionnalités couvertes

- ✅ Auth email/mot de passe + protection des routes via middleware
- ✅ CRUD Plats avec ingrédients (Server Actions + Zod + RHF)
- ✅ Upload photo Supabase Storage (préfixe user_id pour isolation)
- ✅ Génération de planning (random sans remise, verrouillage par jour)
- ✅ Sauvegarde planning en base + cache IndexedDB
- ✅ Liste de courses agrégée (fusion doublons, somme des quantités, regroupement par catégorie)
- ✅ Cases à cocher persistées en localStorage (par semaine)
- ✅ Export PDF (jsPDF) et partage natif (Web Share API)
- ✅ Bottom nav mobile + sidebar desktop
- ✅ Indicateur offline
- ✅ Sync au retour en ligne (invalidation des queries + replay de la file)
- ✅ Skeleton loaders + error boundaries
- ✅ Accessibilité : aria-labels, `aria-current`, `role="switch"`, `aria-pressed`

## Pistes d'extension

- Génération algorithmique plus fine (équilibre par catégorie, évitement des doublons J/J+1)
- Détail recette pas-à-pas (mode cuisine)
- Partage de plats entre comptes
- OAuth Google (ajouter le provider dans Supabase, puis bouton dans le formulaire)
- Mode sombre complet (tokens déjà préparés — il suffit d'un second bloc `@theme` sous `:root[data-theme='dark']`)
