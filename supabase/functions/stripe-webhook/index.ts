// POST /functions/v1/stripe-webhook — Stripe prévient ici quand un paiement est réussi.
// À déclarer dans Stripe (Développeurs → Webhooks) avec l'événement checkout.session.completed.
import { catalogue, db, env, json, servir, signatureStripeValide } from "../_shared/outils.ts";
import { emailPaiementRecu, emailPaiementRecuBoutique, envoyerEmail } from "../_shared/emails.ts";

export const traiter = servir(async (req) => {
  const corps = await req.text();
  if (!(await signatureStripeValide(corps, req.headers.get("Stripe-Signature"), env("STRIPE_WEBHOOK_SECRET"))))
    return json(req, { erreur: "Signature invalide" }, 400);

  const evenement = JSON.parse(corps);
  const session = evenement.data?.object ?? {};
  const payee = ["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(evenement.type) && session.payment_status === "paid";
  const id = session.metadata?.commande_id;
  if (!payee || !id) return json(req, { recu: true });

  const [avant] = await db<any[]>(`commandes?id=eq.${encodeURIComponent(id)}&select=paiement_statut`);
  if (!avant) return json(req, { recu: true, inconnue: true });
  if (avant.paiement_statut === "paye") return json(req, { recu: true, deja: true }); // Stripe peut renvoyer le même événement

  const [commande] = await db<any[]>(`commandes?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ paiement_statut: "paye", paye_le: new Date().toISOString(), stripe_session_id: session.id }),
  });
  await Promise.allSettled([
    envoyerEmail({ a: commande.client_email, ...emailPaiementRecu(commande) }),
    envoyerEmail({ a: env("BOUTIQUE_EMAIL") || (await catalogue()).site?.email, ...emailPaiementRecuBoutique(commande) }),
  ]);
  return json(req, { recu: true, numero: commande.numero });
});

if (import.meta.main) Deno.serve(traiter);
