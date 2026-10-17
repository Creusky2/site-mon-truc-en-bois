// POST /functions/v1/admin — actions réservées à la boutique (connectée à son compte Supabase) :
//   lien_paiement : crée un lien de paiement Stripe pour une commande (et l'envoie au client si demandé)
//   notifier      : envoie au client un email sur l'avancement de sa commande
//   photos        : liens temporaires pour télécharger les photos envoyées par le client
import { creerPaiementStripe, db, env, ErreurClient, json, lireJson, servir, urlLecturePhoto } from "../_shared/outils.ts";
import { emailLienPaiement, emailStatut, envoyerEmail } from "../_shared/emails.ts";

type Demande = { action: "lien_paiement" | "notifier" | "photos"; commande_id: string; envoyer?: boolean; message?: string };

async function verifierAdmin(req: Request) {
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jeton) throw new ErreurClient("Connexion requise.", 401);
  const r = await fetch(`${env("SUPABASE_URL")}/auth/v1/user`, {
    headers: { apikey: env("SUPABASE_ANON_KEY", env("SUPABASE_SERVICE_ROLE_KEY")), Authorization: `Bearer ${jeton}` },
  });
  if (!r.ok) throw new ErreurClient("Session expirée : reconnectez-vous.", 401);
  const utilisateur = await r.json();
  const admins = await db<any[]>(`admins?user_id=eq.${utilisateur.id}&select=user_id`);
  if (!admins.length) throw new ErreurClient("Ce compte n'a pas accès à la gestion des commandes.", 403);
  return utilisateur;
}

export const traiter = servir(async (req) => {
  await verifierAdmin(req);
  const d = await lireJson<Demande>(req, 10_000);
  if (!/^[0-9a-f-]{36}$/i.test(d.commande_id ?? "")) throw new ErreurClient("Commande invalide.");
  const [commande] = await db<any[]>(`commandes?id=eq.${d.commande_id}`);
  if (!commande) throw new ErreurClient("Commande introuvable.", 404);

  if (d.action === "lien_paiement") {
    if (!env("STRIPE_SECRET_KEY")) throw new ErreurClient("Le paiement en ligne n'est pas configuré (clé Stripe manquante).");
    if (commande.paiement_statut === "paye") throw new ErreurClient("Cette commande est déjà payée.");
    const site = env("SITE_URL").replace(/\/$/, "");
    const url = await creerPaiementStripe(commande, `${site}/suivi.html`);
    const email = d.envoyer ? await envoyerEmail({ a: commande.client_email, ...emailLienPaiement(commande, url, d.message) }) : null;
    return json(req, { url, email_envoye: !!email?.envoye });
  }
  if (d.action === "notifier") {
    const email = await envoyerEmail({ a: commande.client_email, ...emailStatut(commande, d.message) });
    if (!email.envoye) throw new ErreurClient(`Email non envoyé (${email.raison}).`);
    return json(req, { email_envoye: true });
  }
  if (d.action === "photos") {
    const photos = await Promise.all(
      (commande.lignes ?? []).map(async (l: any, i: number) => (l.photo_chemin ? { ligne: i, nom: l.photo_nom, url: await urlLecturePhoto(l.photo_chemin) } : null))
    );
    return json(req, { photos: photos.filter(Boolean) });
  }
  throw new ErreurClient("Action inconnue.");
});

if (import.meta.main) Deno.serve(traiter);
