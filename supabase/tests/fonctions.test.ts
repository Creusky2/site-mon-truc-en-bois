// Tests des fonctions serveur avec des services simulés (Supabase, Stripe, Resend, site).
// Lancer : deno test --allow-env --allow-read supabase/tests/
import { assert, assertEquals, assertMatch } from "jsr:@std/assert@1";
import { traiter as commande } from "../functions/commande/index.ts";
import { traiter as webhook } from "../functions/stripe-webhook/index.ts";
import { traiter as suivi } from "../functions/suivi/index.ts";
import { traiter as admin } from "../functions/admin/index.ts";
import { viderCacheCatalogue } from "../functions/_shared/outils.ts";

const SITE = "https://boutique.test";
const SUPA = "https://projet.supabase.test";
Deno.env.set("SITE_URL", SITE);
Deno.env.set("SUPABASE_URL", SUPA);
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "cle-service");
Deno.env.set("RESEND_API_KEY", "re_test");
Deno.env.set("BOUTIQUE_EMAIL", "boutique@test.fr");
Deno.env.set("STRIPE_SECRET_KEY", "sk_test_x");
Deno.env.set("STRIPE_WEBHOOK_SECRET", "whsec_test");

// ---------- Catalogue publié ----------
const fichier = await Deno.readTextFile(new URL("../../data/donnees.js", import.meta.url));
const base = JSON.parse(fichier.slice(fichier.search(/^window\.DONNEES = /m) + 17).trim().replace(/;\s*$/, ""));
let D: any;
function catalogueOuvert(modif: (d: any) => void = () => {}) {
  D = structuredClone(base);
  D.site.apercu = false;
  D.site.livraison = 5.9;
  D.site.livraisonOfferteDes = 60;
  D.site.emballage = { actif: true, prix: 2.5 };
  D.site.commandes = { paiement: { enLigne: true, apresValidation: true, boutique: true } };
  modif(D);
  viderCacheCatalogue();
}

// ---------- Services simulés ----------
let commandes: any[] = [];
let appels: { url: string; methode: string; corps: any }[] = [];
let numero = 0;
const ADMIN = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const JETONS: Record<string, string> = { "jeton-admin": ADMIN, "jeton-client": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" };

const reponse = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });
function filtre(url: URL) {
  const [[cle, valeur]] = [...url.searchParams].filter(([k]) => k !== "select");
  return (c: any) => String(c[cle]) === decodeURIComponent(valeur.replace(/^eq\./, ""));
}
globalThis.fetch = async (entree: string | URL | Request, init: RequestInit = {}) => {
  const url = new URL(entree instanceof Request ? entree.url : String(entree));
  const methode = (init.method ?? "GET").toUpperCase();
  const brut = init.body ? String(init.body) : "";
  let corps: any = brut;
  try { corps = JSON.parse(brut); } catch { corps = Object.fromEntries(new URLSearchParams(brut)); }
  appels.push({ url: url.href, methode, corps });

  if (url.origin === SITE) return new Response(`// en-tête window.DONNEES = ici\nwindow.DONNEES = ${JSON.stringify(D)};\n`);
  if (url.href.startsWith(`${SUPA}/rest/v1/commandes`)) {
    if (methode === "POST") {
      numero++;
      const c = { ...corps, numero: `MTB-2026-${String(numero).padStart(4, "0")}`, jeton_suivi: crypto.randomUUID(), statut: "nouvelle", paiement_statut: "en_attente", notes: "note interne", historique: [{ statut: "nouvelle" }], suivi_colis: "", stripe_url: null };
      commandes.push(c);
      return reponse([c], 201);
    }
    const trouvees = commandes.filter(filtre(url));
    if (methode === "PATCH") {
      trouvees.forEach((c) => {
        Object.assign(c, corps);
        if (c.paiement_statut === "paye" && !c.facture_numero) c.facture_numero = "F-2026-0001";
      });
    }
    return reponse(trouvees);
  }
  if (url.href.startsWith(`${SUPA}/rest/v1/admins`)) return reponse(url.searchParams.get("user_id") === `eq.${ADMIN}` ? [{ user_id: ADMIN }] : []);
  if (url.href.startsWith(`${SUPA}/auth/v1/user`)) {
    const id = JETONS[(new Headers(init.headers).get("Authorization") ?? "").replace("Bearer ", "")];
    return id ? reponse({ id }) : reponse({ msg: "invalid" }, 401);
  }
  if (url.href.startsWith(`${SUPA}/storage/v1/object/upload/sign/`)) return reponse({ url: url.pathname.replace("/storage/v1", "") + "?token=envoi" });
  if (url.href.startsWith(`${SUPA}/storage/v1/object/sign/`)) return reponse({ signedURL: url.pathname.replace("/storage/v1", "") + "?token=lecture" });
  if (url.href === "https://api.stripe.com/v1/checkout/sessions") return reponse({ id: "cs_test_1", url: "https://checkout.stripe.test/cs_test_1" });
  if (url.href === "https://api.resend.com/emails") return reponse({ id: "email_1" });
  return reponse({ erreur: `non simulé : ${url.href}` }, 500);
};
function reinitialiser() {
  commandes = [];
  appels = [];
  numero = 0;
  catalogueOuvert();
}
const post = (fn: (r: Request) => Promise<Response>, corps: unknown, entetes: Record<string, string> = {}) =>
  fn(new Request("https://fonction.test", { method: "POST", headers: { "Content-Type": "application/json", Origin: SITE, ...entetes }, body: typeof corps === "string" ? corps : JSON.stringify(corps) }));
const emails = () => appels.filter((a) => a.url === "https://api.resend.com/emails").map((a) => a.corps);

const demande = (modif: Record<string, unknown> = {}) => ({
  client: { nom: "Marie Test", email: "Marie@Test.fr", tel: "06 12 34 56 78", adresse: "12 rue des Fleurs, 62260 Auchel" },
  mode_reception: "livraison",
  lignes: [
    { id: "planche-aperitif", quantite: 2, variante: 1, texte: "Papa", police: "Classique", prix: 0.01 }, // prix envoyé : ignoré
    { id: "mug-personnalise", quantite: 1, photo: { nom: "photo été.jpg", type: "image/jpeg" } },
  ],
  cadeau: { emballage: true, message: "Bonne fête", date: "2026-12-20" },
  paiement_mode: "apres_validation",
  retour: `${SITE}/commande.html`,
  ...modif,
});

// ---------- Commande ----------
Deno.test("commande : prix recalculés depuis le catalogue, livraison, emballage, photo, emails", async () => {
  reinitialiser();
  const r = await post(commande, demande());
  const c = await r.json();
  assertEquals(r.status, 201);
  assertEquals(c.numero, "MTB-2026-0001");
  const enregistree = commandes[0];
  // planche apéro : 24,90 + 8 (grande) = 32,90 × 2 = 65,80 ; mug 14,90 → 80,70 ; livraison offerte dès 60 € ; emballage 2,50
  assertEquals(enregistree.lignes[0].prix_unitaire, 32.9);
  assertEquals(enregistree.sous_total, 80.7);
  assertEquals(enregistree.port, 0);
  assertEquals(enregistree.emballage, 2.5);
  assertEquals(enregistree.total, 83.2);
  assertEquals(enregistree.client_email, "marie@test.fr");
  assertMatch(enregistree.lignes[1].photo_chemin, /^[0-9a-f-]{36}\/2-photo-ete\.jpg$/);
  assertEquals(c.envois_photos.length, 1);
  assertMatch(c.envois_photos[0].url, /^https:\/\/projet\.supabase\.test\/storage\/v1\/object\/upload\/sign\/photos-clients\/.+\?token=envoi$/);
  assertEquals(c.paiement_url, null);
  const e = emails();
  assertEquals(e.length, 2);
  assertEquals(e.map((x) => x.to[0]).sort(), ["boutique@test.fr", "marie@test.fr"]);
  assert(e.some((x) => x.subject.startsWith("Nouvelle commande MTB-2026-0001")));
});

Deno.test("commande : petite commande livrée → frais de port", async () => {
  reinitialiser();
  await post(commande, demande({ lignes: [{ id: "porte-cles-grave", quantite: 1 }], cadeau: {} }));
  assertEquals(commandes[0].port, 5.9);
  assertEquals(commandes[0].total, 15.8);
});

Deno.test("commande : paiement en ligne → session Stripe en centimes", async () => {
  reinitialiser();
  const r = await post(commande, demande({ paiement_mode: "en_ligne" }));
  const c = await r.json();
  assertEquals(c.paiement_url, "https://checkout.stripe.test/cs_test_1");
  const s = appels.find((a) => a.url.includes("stripe.com"))!.corps;
  assertEquals(s["line_items[0][price_data][unit_amount]"], "3290");
  assertEquals(s["line_items[0][quantity]"], "2");
  assertEquals(s["line_items[2][price_data][product_data][name]"], "Emballage cadeau");
  assertEquals(s["metadata[commande_id]"], commandes[0].id);
  assertMatch(s.success_url, /^https:\/\/boutique\.test\/commande\.html\?jeton=.+&paiement=ok$/);
  assertEquals(commandes[0].stripe_session_id, "cs_test_1");
});

Deno.test("commande : refus si site en construction, produit inconnu, email invalide, mode de paiement incohérent", async () => {
  reinitialiser();
  catalogueOuvert((d) => (d.site.apercu = true));
  assertEquals((await post(commande, demande())).status, 403);
  catalogueOuvert();
  assertEquals((await post(commande, demande({ lignes: [{ id: "nexiste-pas", quantite: 1 }] }))).status, 400);
  assertEquals((await post(commande, demande({ client: { nom: "A B", email: "faux", tel: "0612345678" } }))).status, 400);
  assertEquals((await post(commande, demande({ paiement_mode: "boutique" }))).status, 400); // boutique = retrait uniquement
  assertEquals((await post(commande, demande({ lignes: [{ id: "planche-aperitif", quantite: 0 }] }))).status, 400);
  catalogueOuvert((d) => (d.site.commandes.paiement.enLigne = false));
  assertEquals((await post(commande, demande({ paiement_mode: "en_ligne" }))).status, 400);
  assertEquals(commandes.length, 0);
});

// ---------- Webhook Stripe ----------
async function signer(corps: string, secret = "whsec_test") {
  const t = Math.floor(Date.now() / 1000);
  const cle = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", cle, new TextEncoder().encode(`${t}.${corps}`)));
  return `t=${t},v1=${[...mac].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}
Deno.test("webhook Stripe : signature vérifiée, commande marquée payée une seule fois", async () => {
  reinitialiser();
  await post(commande, demande({ paiement_mode: "en_ligne" }));
  const evenement = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_test_1", payment_status: "paid", metadata: { commande_id: commandes[0].id } } } });
  assertEquals((await post(webhook, evenement, { "Stripe-Signature": await signer(evenement, "mauvais") })).status, 400);
  assertEquals(commandes[0].paiement_statut, "en_attente");
  appels = [];
  const r = await post(webhook, evenement, { "Stripe-Signature": await signer(evenement) });
  assertEquals(r.status, 200);
  assertEquals(commandes[0].paiement_statut, "paye");
  assertEquals(emails().length, 2);
  appels = [];
  const deja = await (await post(webhook, evenement, { "Stripe-Signature": await signer(evenement) })).json();
  assertEquals(deja.deja, true);
  assertEquals(emails().length, 0);
});

// ---------- Suivi client ----------
Deno.test("suivi : par lien ou numéro + email, sans les notes internes", async () => {
  reinitialiser();
  await post(commande, demande({ paiement_mode: "en_ligne" }));
  const c = commandes[0];
  const parJeton = await (await post(suivi, { jeton: c.jeton_suivi })).json();
  assertEquals(parJeton.numero, "MTB-2026-0001");
  assertEquals(parJeton.statut_libelle, "Commande reçue");
  assertEquals(parJeton.notes, undefined);
  assertEquals(parJeton.client_email, undefined);
  assertEquals(parJeton.paiement_possible, true);
  assertEquals((await post(suivi, { numero: "mtb-2026-0001", email: "autre@test.fr" })).status, 404);
  assertEquals((await (await post(suivi, { numero: "mtb-2026-0001", email: "MARIE@test.fr" })).json()).numero, "MTB-2026-0001");
  const payer = await (await post(suivi, { jeton: c.jeton_suivi, action: "payer", retour: `${SITE}/suivi.html` })).json();
  assertEquals(payer.paiement_url, "https://checkout.stripe.test/cs_test_1");
});

Deno.test("suivi : paiement après validation possible seulement une fois le lien envoyé par la boutique", async () => {
  reinitialiser();
  await post(commande, demande());
  const c = commandes[0];
  assertEquals((await (await post(suivi, { jeton: c.jeton_suivi })).json()).paiement_possible, false);
  assertEquals((await post(suivi, { jeton: c.jeton_suivi, action: "payer" })).status, 400);
});

// ---------- Actions admin ----------
Deno.test("admin : accès refusé sans compte admin, lien de paiement, email, photos", async () => {
  reinitialiser();
  await post(commande, demande());
  const id = commandes[0].id;
  assertEquals((await post(admin, { action: "photos", commande_id: id })).status, 401);
  assertEquals((await post(admin, { action: "photos", commande_id: id }, { Authorization: "Bearer jeton-client" })).status, 403);
  const auth = { Authorization: "Bearer jeton-admin" };
  appels = [];
  const lien = await (await post(admin, { action: "lien_paiement", commande_id: id, envoyer: true, message: "Maquette validée, merci !" }, auth)).json();
  assertEquals(lien.url, "https://checkout.stripe.test/cs_test_1");
  assertEquals(lien.email_envoye, true);
  assertMatch(emails()[0].subject, /votre lien de paiement/);
  assertEquals((await (await post(suivi, { jeton: commandes[0].jeton_suivi })).json()).paiement_possible, true);
  commandes[0].statut = "prete";
  const notif = await (await post(admin, { action: "notifier", commande_id: id }, auth)).json();
  assertEquals(notif.email_envoye, true);
  assertMatch(emails().at(-1).subject, /Prête à retirer/);
  const photos = await (await post(admin, { action: "photos", commande_id: id }, auth)).json();
  assertEquals(photos.photos.length, 1);
  assertMatch(photos.photos[0].url, /\/storage\/v1\/object\/sign\/photos-clients\/.+\?token=lecture$/);
});

Deno.test("CORS : réponse au pré-contrôle du navigateur", async () => {
  const r = await commande(new Request("https://fonction.test", { method: "OPTIONS", headers: { Origin: SITE } }));
  assertEquals(r.status, 200);
  assertEquals(r.headers.get("Access-Control-Allow-Origin"), "*");
});
