-- ============================================================================
-- Weekeat — Schéma Supabase complet
-- ============================================================================
-- Exécuter dans le SQL Editor Supabase, ou via `supabase db push` en local.
-- Ordre : extensions → types → tables → indexes → triggers → RLS → storage.
-- ============================================================================

-- Extensions --------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums -------------------------------------------------------------------
do $$ begin
  create type plat_categorie as enum ('viande','poisson','vegetarien','vegan','soupe','pates','autre');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ingredient_unite as enum ('g','kg','ml','L','piece','cas','cac','autre');
exception when duplicate_object then null; end $$;

do $$ begin
  create type planning_mode as enum ('midi_soir','midi','soir');
exception when duplicate_object then null; end $$;

do $$ begin
  create type jour_semaine as enum ('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche');
exception when duplicate_object then null; end $$;

do $$ begin
  create type moment_repas as enum ('midi','soir');
exception when duplicate_object then null; end $$;

-- profiles ----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- plats -------------------------------------------------------------------
create table if not exists public.plats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  nom text not null check (length(nom) between 1 and 120),
  temps_cuisson integer check (temps_cuisson is null or temps_cuisson between 0 and 600),
  categorie plat_categorie not null default 'autre',
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plats_user_id_idx on public.plats(user_id);
create index if not exists plats_categorie_idx on public.plats(categorie);
create index if not exists plats_updated_at_idx on public.plats(updated_at desc);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists plats_updated_at on public.plats;
create trigger plats_updated_at
  before update on public.plats
  for each row execute function public.set_updated_at();

-- ingredients -------------------------------------------------------------
create table if not exists public.ingredients (
  id uuid primary key default uuid_generate_v4(),
  plat_id uuid not null references public.plats(id) on delete cascade,
  nom text not null check (length(nom) between 1 and 120),
  quantite numeric(10,3),
  unite ingredient_unite not null default 'autre'
);

create index if not exists ingredients_plat_id_idx on public.ingredients(plat_id);

-- plannings ---------------------------------------------------------------
create table if not exists public.plannings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  semaine_debut date not null,
  mode planning_mode not null default 'midi_soir',
  created_at timestamptz not null default now(),
  unique (user_id, semaine_debut)
);

create index if not exists plannings_user_idx on public.plannings(user_id);
create index if not exists plannings_week_idx on public.plannings(semaine_debut desc);

-- planning_repas ----------------------------------------------------------
create table if not exists public.planning_repas (
  id uuid primary key default uuid_generate_v4(),
  planning_id uuid not null references public.plannings(id) on delete cascade,
  plat_id uuid references public.plats(id) on delete set null,
  jour jour_semaine not null,
  moment moment_repas not null,
  verrouille boolean not null default false,
  unique (planning_id, jour, moment)
);

create index if not exists planning_repas_planning_idx on public.planning_repas(planning_id);
create index if not exists planning_repas_plat_idx on public.planning_repas(plat_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles        enable row level security;
alter table public.plats           enable row level security;
alter table public.ingredients     enable row level security;
alter table public.plannings       enable row level security;
alter table public.planning_repas  enable row level security;

-- profiles ----------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- plats -------------------------------------------------------------------
drop policy if exists "plats_select_own" on public.plats;
create policy "plats_select_own" on public.plats
  for select using (auth.uid() = user_id);

drop policy if exists "plats_insert_own" on public.plats;
create policy "plats_insert_own" on public.plats
  for insert with check (auth.uid() = user_id);

drop policy if exists "plats_update_own" on public.plats;
create policy "plats_update_own" on public.plats
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "plats_delete_own" on public.plats;
create policy "plats_delete_own" on public.plats
  for delete using (auth.uid() = user_id);

-- ingredients : accès via le plat parent ---------------------------------
drop policy if exists "ingredients_select_via_plat" on public.ingredients;
create policy "ingredients_select_via_plat" on public.ingredients
  for select using (exists (
    select 1 from public.plats p where p.id = ingredients.plat_id and p.user_id = auth.uid()
  ));

drop policy if exists "ingredients_mutate_via_plat" on public.ingredients;
create policy "ingredients_mutate_via_plat" on public.ingredients
  for all using (exists (
    select 1 from public.plats p where p.id = ingredients.plat_id and p.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.plats p where p.id = ingredients.plat_id and p.user_id = auth.uid()
  ));

-- plannings ---------------------------------------------------------------
drop policy if exists "plannings_select_own" on public.plannings;
create policy "plannings_select_own" on public.plannings
  for select using (auth.uid() = user_id);

drop policy if exists "plannings_insert_own" on public.plannings;
create policy "plannings_insert_own" on public.plannings
  for insert with check (auth.uid() = user_id);

drop policy if exists "plannings_update_own" on public.plannings;
create policy "plannings_update_own" on public.plannings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "plannings_delete_own" on public.plannings;
create policy "plannings_delete_own" on public.plannings
  for delete using (auth.uid() = user_id);

-- planning_repas : accès via le planning parent --------------------------
drop policy if exists "planning_repas_select_via" on public.planning_repas;
create policy "planning_repas_select_via" on public.planning_repas
  for select using (exists (
    select 1 from public.plannings pl where pl.id = planning_repas.planning_id and pl.user_id = auth.uid()
  ));

drop policy if exists "planning_repas_mutate_via" on public.planning_repas;
create policy "planning_repas_mutate_via" on public.planning_repas
  for all using (exists (
    select 1 from public.plannings pl where pl.id = planning_repas.planning_id and pl.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.plannings pl where pl.id = planning_repas.planning_id and pl.user_id = auth.uid()
  ));

-- ============================================================================
-- Storage — bucket "plats-photos"
-- ============================================================================
-- À exécuter dans Studio > Storage, ou via ce bloc :
insert into storage.buckets (id, name, public)
values ('plats-photos', 'plats-photos', true)
on conflict (id) do nothing;

drop policy if exists "plats_photos_read_all" on storage.objects;
create policy "plats_photos_read_all" on storage.objects
  for select using (bucket_id = 'plats-photos');

drop policy if exists "plats_photos_upload_own" on storage.objects;
create policy "plats_photos_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'plats-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "plats_photos_update_own" on storage.objects;
create policy "plats_photos_update_own" on storage.objects
  for update using (
    bucket_id = 'plats-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "plats_photos_delete_own" on storage.objects;
create policy "plats_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'plats-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
