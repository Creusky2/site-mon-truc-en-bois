// POST /functions/v1/contact — demandes envoyées depuis le site : devis, message, inscription ou désinscription newsletter.
// Chaque demande arrive dans l'admin (onglet Demandes) et crée ou complète la fiche client.
import { catalogue, cleDesinscription, db, enregistrerClient, env, ErreurClient, json, lireJson, servir } from "../_shared/outils.ts";
import { emailAccuseDemande, emailConfirmerDesinscription, emailDemandeBoutique, envoyerEmail } from "../_shared/emails.ts";

type Demande = {
  type?: "devis" | "contact" | "newsletter";
  action?: "desinscription";
  cle?: string; // clé personnelle du lien de désinscription reçu par email
  nom?: string;
  email?: string;
  tel?: string;
  sujet?: string;
  message?: string;
  quantite?: number;
  consentement_marketing?: boolean;
  site_web?: string; // champ caché : rempli seulement par les robots
};

const texte = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export const traiter = servir(async (req) => {
  const d = await lireJson<Demande>(req, 20_000);
  const email = texte(d.email, 160).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ErreurClient("Adresse email invalide.");
  if (d.site_web) return json(req, { recu: true }); // robot : on fait comme si de rien n'était

  if (d.action === "desinscription") {
    // Avec la clé du lien personnel : désinscription immédiate. Sans elle (formulaire du site), on écrit à l'adresse
    // pour confirmer : personne ne peut désinscrire quelqu'un d'autre.
    if (d.cle && d.cle === (await cleDesinscription(email))) {
      await db(`clients?email=eq.${encodeURIComponent(email)}`, { method: "PATCH", body: JSON.stringify({ consentement_marketing: false, consentement_le: new Date().toISOString() }) });
      return json(req, { desinscrit: true });
    }
    const [abonne] = await db<any[]>(`clients?email=eq.${encodeURIComponent(email)}&consentement_marketing=eq.true&select=id`);
    if (abonne) await envoyerEmail({ a: email, ...(await emailConfirmerDesinscription(email)) });
    return json(req, { confirmation_envoyee: true }); // même réponse que l'adresse soit abonnée ou non
  }

  const type = (["devis", "contact", "newsletter"] as const).includes(d.type as never) ? d.type! : "contact";
  const nomSaisi = texte(d.nom, 120);
  const nom = nomSaisi || (type === "newsletter" ? email.split("@")[0] : "");
  const message = texte(d.message, 4000);
  if (type !== "newsletter" && nom.length < 2) throw new ErreurClient("Indiquez votre nom.");
  if (type !== "newsletter" && message.length < 5) throw new ErreurClient("Décrivez votre demande en quelques mots.");

  const fiche = await enregistrerClient({
    nom: nomSaisi, // vide : le nom déjà connu de la fiche est gardé
    email,
    tel: texte(d.tel, 30),
    source: type === "newsletter" ? "newsletter" : "site",
    consentement: type === "newsletter" || !!d.consentement_marketing,
  });
  const [demande] = await db<any[]>("demandes", {
    method: "POST",
    body: JSON.stringify({
      type,
      nom,
      email,
      tel: texte(d.tel, 30),
      sujet: texte(d.sujet, 120),
      message,
      quantite: Number.isFinite(Number(d.quantite)) && Number(d.quantite) > 0 ? Math.trunc(Number(d.quantite)) : null,
      client_id: fiche?.id ?? null,
      statut: type === "newsletter" ? "archivee" : "nouvelle",
    }),
  });

  const boutique = env("BOUTIQUE_EMAIL") || (await catalogue()).site?.email;
  await Promise.allSettled([
    type !== "newsletter" ? envoyerEmail({ a: boutique, ...emailDemandeBoutique(demande), repondreA: email }) : null,
    envoyerEmail({ a: email, ...(await emailAccuseDemande(demande)), repondreA: boutique }),
  ]);
  return json(req, { recu: true }, 201);
});

if (import.meta.main) Deno.serve(traiter);
