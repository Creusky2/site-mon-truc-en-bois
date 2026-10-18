-- ============================================================
--  Corrections avant l'ouverture : compteur des codes promo fiable.
--  Installé automatiquement par l'assistant de l'admin ; rejouable sans risque.
-- ============================================================

-- Compte une utilisation d'un code promo en une seule opération : deux commandes simultanées comptent bien pour deux,
-- et le nombre maximum d'utilisations ne peut pas être dépassé. Renvoie false si le code est épuisé ou inconnu.
create or replace function public.utiliser_code_promo(p_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  with maj as (
    update public.codes_promo
    set utilisations = utilisations + 1
    where code = p_code and actif and (utilisations_max is null or utilisations < utilisations_max)
    returning 1
  )
  select exists (select 1 from maj);
$$;
revoke all on function public.utiliser_code_promo(text) from public, anon, authenticated;
grant execute on function public.utiliser_code_promo(text) to service_role;

-- Texte du bouton des emails aux abonnés, pour « Réutiliser » un envoi précédent à l'identique.
alter table public.campagnes add column if not exists texte_lien text not null default '';

-- Statistiques : le chiffre d'affaires ne compte plus les commandes remboursées (ni, comme avant, les annulées).
create or replace view public.stats_ventes with (security_invoker = true) as
  select
    date_trunc('month', cree_le at time zone 'Europe/Paris')::date as mois,
    canal,
    count(*)::int as commandes,
    coalesce(sum(total), 0)::numeric(12, 2) as chiffre_affaires,
    coalesce(sum(total) filter (where paiement_statut = 'paye'), 0)::numeric(12, 2) as encaisse
  from public.commandes
  where statut <> 'annulee' and paiement_statut <> 'rembourse'
  group by 1, 2;
