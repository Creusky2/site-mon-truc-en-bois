// POST /functions/v1/commande — enregistre une commande envoyée depuis le panier.
// Les prix sont recalculés ici à partir du catalogue publié : ceux du navigateur ne sont jamais utilisés.
// Avec { simulation: true }, renvoie seulement les montants (pour afficher le total exact et tester un code promo).
import {
  calculerCommande, catalogue, chercherCodePromo, compterUtilisation, creerPaiementStripe, db, enregistrerClient, env,
  ErreurClient, json, lireJson, modesPaiement, nomFichier, servir, urlEnvoiPhoto, validerClient, type DemandeCommande,
} from "../_shared/outils.ts";
import { emailConfirmationClient, emailNouvelleCommande, envoyerEmail } from "../_shared/emails.ts";

export const traiter = servir(async (req) => {
  const demande = await lireJson<DemandeCommande>(req);
  const D = await catalogue();

  if (demande.simulation) {
    const base = calculerCommande(D, demande);
    let promo = null;
    let erreur_code = "";
    try {
      promo = await chercherCodePromo(demande.code_promo, base.sous_total);
    } catch (e) {
      if (!(e instanceof ErreurClient)) throw e;
      erreur_code = e.message;
    }
    const c = calculerCommande(D, demande, promo);
    return json(req, { sous_total: c.sous_total, port: c.port, emballage: c.emballage, remise: c.remise, code_promo: c.code_promo, total: c.total, erreur_code, promo_description: promo?.description ?? "" });
  }

  if (D.site?.apercu) throw new ErreurClient("Les commandes en ligne ne sont pas encore ouvertes. Contactez-nous par téléphone.", 403);
  const client = validerClient(demande);
  const promo = await chercherCodePromo(demande.code_promo, calculerCommande(D, demande).sous_total);
  const calcul = calculerCommande(D, demande, promo);
  const modes = modesPaiement(D);
  const mode = demande.paiement_mode;
  if (!(mode in modes) || !modes[mode as keyof typeof modes]) throw new ErreurClient("Ce mode de paiement n'est pas disponible.");
  if (mode === "boutique" && demande.mode_reception !== "retrait") throw new ErreurClient("Le paiement en boutique est réservé au retrait à la boutique.");
  if (calcul.total <= 0 && mode === "en_ligne") throw new ErreurClient("Le montant à payer est nul : choisissez un autre mode de paiement.");

  // Chemins des photos envoyées par le client (le navigateur les dépose ensuite avec les adresses fournies)
  const id = crypto.randomUUID();
  calcul.lignes.forEach((l, i) => {
    if (l.photo_nom) l.photo_chemin = `${id}/${i + 1}-${nomFichier(l.photo_nom)}`;
  });

  const fiche = await enregistrerClient({ ...client, source: "site", consentement: !!demande.consentement_marketing });
  const cadeau = {
    emballage: !!calcul.emballage,
    message: String(demande.cadeau?.message ?? "").trim().slice(0, 160),
    date: /^\d{4}-\d{2}-\d{2}$/.test(demande.cadeau?.date ?? "") ? demande.cadeau!.date : "",
  };
  const [commande] = await db<any[]>("commandes", {
    method: "POST",
    body: JSON.stringify({
      id,
      client_id: fiche?.id ?? null,
      canal: "site",
      client_nom: client.nom,
      client_email: client.email,
      client_tel: client.tel,
      adresse: client.adresse,
      mode_reception: demande.mode_reception,
      message: String(demande.message ?? "").trim().slice(0, 1000),
      cadeau,
      paiement_mode: mode,
      ...calcul,
    }),
  });
  await compterUtilisation(promo);

  const envois = await Promise.all(
    calcul.lignes.map(async (l, i) => (l.photo_chemin ? { ligne: i, url: await urlEnvoiPhoto(l.photo_chemin) } : null))
  );

  // Adresse de retour après paiement : uniquement une page du site
  const site = env("SITE_URL").replace(/\/$/, "");
  const retour = demande.retour && demande.retour.startsWith(site + "/") ? demande.retour.split("?")[0] : `${site}/suivi.html`;
  const paiementUrl = mode === "en_ligne" ? await creerPaiementStripe(commande, retour) : undefined;

  const boutique = env("BOUTIQUE_EMAIL", D.site?.email ?? "");
  await Promise.allSettled([
    envoyerEmail({ a: boutique, ...emailNouvelleCommande(commande), repondreA: commande.client_email }),
    envoyerEmail({ a: commande.client_email, ...emailConfirmationClient(commande, paiementUrl), repondreA: boutique }),
  ]);

  return json(req, {
    numero: commande.numero,
    jeton: commande.jeton_suivi,
    total: commande.total,
    paiement_url: paiementUrl ?? null,
    envois_photos: envois.filter(Boolean),
  }, 201);
});

if (import.meta.main) Deno.serve(traiter);
