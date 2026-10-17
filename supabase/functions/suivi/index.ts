// POST /functions/v1/suivi — le client consulte sa commande (lien reçu par email, ou numéro + email),
// et peut demander un lien de paiement si la commande attend un paiement en ligne.
import { catalogue, champsPublics, creerPaiementStripe, db, env, ErreurClient, json, lireJson, modesPaiement, servir } from "../_shared/outils.ts";

type Demande = { jeton?: string; numero?: string; email?: string; action?: "payer"; retour?: string };

export const traiter = servir(async (req) => {
  const d = await lireJson<Demande>(req, 5_000);
  let commande: any;
  if (d.jeton && /^[0-9a-f-]{36}$/i.test(d.jeton)) {
    [commande] = await db<any[]>(`commandes?jeton_suivi=eq.${d.jeton}`);
  } else if (d.numero && d.email) {
    const [c] = await db<any[]>(`commandes?numero=eq.${encodeURIComponent(d.numero.trim().toUpperCase())}`);
    if (c && c.client_email.toLowerCase() === d.email.trim().toLowerCase()) commande = c;
  } else throw new ErreurClient("Indiquez votre numéro de commande et votre email.");
  if (!commande) throw new ErreurClient("Commande introuvable : vérifiez le numéro et l'adresse email.", 404);

  const D = await catalogue();
  const paiementPossible =
    commande.paiement_statut === "en_attente" &&
    commande.statut !== "annulee" &&
    commande.paiement_mode !== "boutique" &&
    modesPaiement(D).en_ligne &&
    (commande.paiement_mode === "en_ligne" || !!commande.stripe_url); // après validation : seulement une fois le lien envoyé par la boutique

  if (d.action === "payer") {
    if (!paiementPossible) throw new ErreurClient("Cette commande ne peut pas être payée en ligne pour le moment.");
    const site = env("SITE_URL").replace(/\/$/, "");
    const retour = d.retour && d.retour.startsWith(site + "/") ? d.retour.split("?")[0] : `${site}/suivi.html`;
    return json(req, { paiement_url: await creerPaiementStripe(commande, retour) });
  }
  return json(req, { ...champsPublics(commande), jeton: commande.jeton_suivi, paiement_possible: paiementPossible });
});

if (import.meta.main) Deno.serve(traiter);
