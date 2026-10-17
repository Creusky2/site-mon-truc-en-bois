-- ============================================================
--  Commandes de la boutique Mon Truc en Bois
--  À exécuter une fois dans Supabase (SQL Editor) — voir docs/mise-en-ligne.md
-- ============================================================

-- ---------- Administrateurs (comptes Supabase autorisés à gérer les commandes) ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cree_le timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create policy "admins : lecture de sa propre ligne" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------- Commandes ----------
create sequence if not exists public.commandes_numero_seq;
create sequence if not exists public.factures_numero_seq;

create table if not exists public.commandes (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique
    default ('MTB-' || to_char(now() at time zone 'Europe/Paris', 'YYYY') || '-' || lpad(nextval('public.commandes_numero_seq')::text, 4, '0')),
  jeton_suivi uuid not null unique default gen_random_uuid(),   -- lien de suivi envoyé au client
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),

  statut text not null default 'nouvelle'
    check (statut in ('nouvelle', 'confirmee', 'en_fabrication', 'prete', 'expediee', 'terminee', 'annulee')),
  historique jsonb not null default '[]'::jsonb,                 -- [{date, statut}]

  client_nom text not null check (char_length(client_nom) between 2 and 120),
  client_email text not null check (client_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  client_tel text not null default '',
  mode_reception text not null check (mode_reception in ('livraison', 'retrait')),
  adresse text not null default '',
  message text not null default '',
  cadeau jsonb not null default '{}'::jsonb,                     -- {emballage, message, date}

  lignes jsonb not null check (jsonb_typeof(lignes) = 'array' and jsonb_array_length(lignes) between 1 and 50),
  sous_total numeric(10, 2) not null check (sous_total >= 0),
  port numeric(10, 2) not null default 0 check (port >= 0),
  emballage numeric(10, 2) not null default 0 check (emballage >= 0),
  total numeric(10, 2) not null check (total >= 0),

  paiement_mode text not null default 'apres_validation'
    check (paiement_mode in ('en_ligne', 'apres_validation', 'boutique')),
  paiement_statut text not null default 'en_attente'
    check (paiement_statut in ('en_attente', 'paye', 'rembourse')),
  paye_le timestamptz,
  stripe_session_id text,
  stripe_url text,
  facture_numero text unique,                                    -- attribué au paiement, numérotation continue

  suivi_colis text not null default '',
  notes text not null default ''                                 -- notes internes, jamais montrées au client
);

create index if not exists commandes_cree_le_idx on public.commandes (cree_le desc);
create index if not exists commandes_statut_idx on public.commandes (statut);

-- Date de mise à jour, historique des statuts et numéro de facture automatiques
create or replace function public.commandes_avant_ecriture()
returns trigger
language plpgsql
as $$
begin
  new.maj_le := now();
  if tg_op = 'INSERT' then
    new.historique := jsonb_build_array(jsonb_build_object('date', now(), 'statut', new.statut));
  elsif new.statut is distinct from old.statut then
    new.historique := coalesce(old.historique, '[]'::jsonb) || jsonb_build_object('date', now(), 'statut', new.statut);
  end if;
  if new.paiement_statut = 'paye' and new.facture_numero is null then
    new.facture_numero := 'F-' || to_char(now() at time zone 'Europe/Paris', 'YYYY') || '-' || lpad(nextval('public.factures_numero_seq')::text, 4, '0');
    new.paye_le := coalesce(new.paye_le, now());
  end if;
  return new;
end;
$$;

drop trigger if exists commandes_avant_ecriture on public.commandes;
create trigger commandes_avant_ecriture
  before insert or update on public.commandes
  for each row execute function public.commandes_avant_ecriture();

-- Sécurité : seuls les administrateurs lisent et modifient les commandes.
-- Les clients ne passent jamais par la base directement : les fonctions serveur (clé de service) créent les
-- commandes après avoir recalculé les prix, et le suivi client passe par la fonction « suivi ».
alter table public.commandes enable row level security;

create policy "commandes : lecture admin" on public.commandes
  for select to authenticated using (public.est_admin());
create policy "commandes : modification admin" on public.commandes
  for update to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "commandes : suppression admin" on public.commandes
  for delete to authenticated using (public.est_admin());

-- Les administrateurs ne peuvent pas modifier les montants ni le numéro (seulement le suivi de la commande).
revoke update on public.commandes from authenticated;
grant select, delete on public.commandes to authenticated;
grant update (statut, paiement_statut, paye_le, suivi_colis, notes, stripe_session_id, stripe_url) on public.commandes to authenticated;

-- ---------- Photos envoyées par les clients ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos-clients', 'photos-clients', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

create policy "photos clients : lecture admin" on storage.objects
  for select to authenticated using (bucket_id = 'photos-clients' and public.est_admin());
create policy "photos clients : suppression admin" on storage.objects
  for delete to authenticated using (bucket_id = 'photos-clients' and public.est_admin());
