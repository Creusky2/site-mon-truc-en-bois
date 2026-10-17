-- ============================================================
--  CRM : fiches clients, demandes (devis, contact, newsletter), codes promo,
--  ventes en boutique / par téléphone, statistiques.
--  Installé automatiquement par l'assistant de l'admin ; rejouable sans risque.
-- ============================================================

-- ---------- Fiches clients ----------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  nom text not null default '' check (char_length(nom) <= 120),
  email text unique check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),   -- toujours en minuscules
  tel text not null default '',
  adresse text not null default '',
  notes text not null default '',
  etiquettes text[] not null default '{}',
  source text not null default 'site' check (source in ('site', 'boutique', 'telephone', 'salon', 'newsletter', 'autre')),
  consentement_marketing boolean not null default false,
  consentement_le timestamptz
);
create index if not exists clients_nom_idx on public.clients (lower(nom));

-- ---------- Commandes : canal de vente, remise, code promo, moyen de paiement, lien client ----------
alter table public.commandes add column if not exists client_id uuid references public.clients (id) on delete set null;
alter table public.commandes add column if not exists canal text not null default 'site';
alter table public.commandes add column if not exists remise numeric(10, 2) not null default 0;
alter table public.commandes add column if not exists code_promo text not null default '';
alter table public.commandes add column if not exists paiement_moyen text not null default '';
do $$ begin
  alter table public.commandes add constraint commandes_canal_check check (canal in ('site', 'boutique', 'telephone', 'salon'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.commandes add constraint commandes_remise_check check (remise >= 0);
exception when duplicate_object then null; end $$;
create index if not exists commandes_client_idx on public.commandes (client_id);
grant update (statut, paiement_statut, paye_le, suivi_colis, notes, stripe_session_id, stripe_url, paiement_moyen, client_id) on public.commandes to authenticated;

-- ---------- Demandes : devis, contact, inscription à la newsletter ----------
create table if not exists public.demandes (
  id uuid primary key default gen_random_uuid(),
  cree_le timestamptz not null default now(),
  type text not null default 'contact' check (type in ('devis', 'contact', 'newsletter')),
  statut text not null default 'nouvelle' check (statut in ('nouvelle', 'en_cours', 'repondue', 'convertie', 'archivee')),
  nom text not null default '',
  email text not null default '',
  tel text not null default '',
  sujet text not null default '',
  message text not null default '',
  quantite integer,
  notes text not null default '',
  client_id uuid references public.clients (id) on delete set null
);
create index if not exists demandes_cree_le_idx on public.demandes (cree_le desc);

-- ---------- Codes promo ----------
create table if not exists public.codes_promo (
  code text primary key check (code = upper(code) and char_length(code) between 3 and 30),
  cree_le timestamptz not null default now(),
  description text not null default '',
  type text not null default 'pourcentage' check (type in ('pourcentage', 'montant')),
  valeur numeric(10, 2) not null check (valeur > 0),
  minimum numeric(10, 2) not null default 0,
  debut date,
  fin date,
  utilisations_max integer,
  utilisations integer not null default 0,
  actif boolean not null default true
);

-- ---------- Emails envoyés aux abonnés (historique) ----------
create table if not exists public.campagnes (
  id uuid primary key default gen_random_uuid(),
  cree_le timestamptz not null default now(),
  sujet text not null,
  message text not null default '',
  lien text not null default '',
  destinataires integer not null default 0
);

-- ---------- Mises à jour automatiques ----------
create or replace function public.maj_le_automatique()
returns trigger language plpgsql as $$
begin
  new.maj_le := now();
  return new;
end;
$$;
drop trigger if exists clients_maj_le on public.clients;
create trigger clients_maj_le before update on public.clients for each row execute function public.maj_le_automatique();

-- ---------- Sécurité : tout est réservé aux administrateurs ----------
alter table public.clients enable row level security;
alter table public.demandes enable row level security;
alter table public.codes_promo enable row level security;
alter table public.campagnes enable row level security;

drop policy if exists "clients : admin" on public.clients;
create policy "clients : admin" on public.clients for all to authenticated using (public.est_admin()) with check (public.est_admin());
drop policy if exists "demandes : admin" on public.demandes;
create policy "demandes : admin" on public.demandes for all to authenticated using (public.est_admin()) with check (public.est_admin());
drop policy if exists "campagnes : admin lecture" on public.campagnes;
create policy "campagnes : admin lecture" on public.campagnes for select to authenticated using (public.est_admin());
drop policy if exists "codes promo : admin" on public.codes_promo;
create policy "codes promo : admin" on public.codes_promo for all to authenticated using (public.est_admin()) with check (public.est_admin());

grant select, insert, update, delete on public.clients, public.demandes, public.codes_promo to authenticated;
revoke all on public.clients, public.demandes, public.codes_promo from anon;
grant select on public.campagnes to authenticated;
revoke all on public.campagnes from anon;

-- ---------- Statistiques (respectent les droits de la personne connectée) ----------
create or replace view public.stats_ventes with (security_invoker = true) as
  select
    date_trunc('month', cree_le at time zone 'Europe/Paris')::date as mois,
    canal,
    count(*)::int as commandes,
    coalesce(sum(total), 0)::numeric(12, 2) as chiffre_affaires,
    coalesce(sum(total) filter (where paiement_statut = 'paye'), 0)::numeric(12, 2) as encaisse
  from public.commandes
  where statut <> 'annulee'
  group by 1, 2;
grant select on public.stats_ventes to authenticated;
revoke all on public.stats_ventes from anon;

-- ---------- Reprise : une fiche client pour chaque client des commandes existantes ----------
insert into public.clients (nom, email, tel, adresse, source, cree_le)
select distinct on (lower(client_email)) client_nom, lower(client_email), client_tel, adresse, 'site', cree_le
from public.commandes
where client_email <> '' and client_email not like '%.invalid'
order by lower(client_email), cree_le desc
on conflict (email) do nothing;

update public.commandes c set client_id = cl.id
from public.clients cl
where c.client_id is null and c.client_email not like '%.invalid' and cl.email = lower(c.client_email);
