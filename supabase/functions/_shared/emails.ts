// Emails envoyés par le site (service Resend). Sans clé RESEND_API_KEY, rien n'est envoyé
// et la commande reste visible dans l'admin : un email raté ne bloque jamais une commande.
import { env, euros, STATUTS } from "./outils.ts";

const echapper = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function envoyerEmail({ a, sujet, html, repondreA }: { a: string; sujet: string; html: string; repondreA?: string }) {
  const cle = env("RESEND_API_KEY");
  if (!cle || !a) return { envoye: false, raison: "non configuré" };
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env("EMAIL_EXPEDITEUR", "Mon Truc en Bois <onboarding@resend.dev>"),
      to: [a],
      subject: sujet,
      html,
      ...(repondreA ? { reply_to: repondreA } : {}),
    }),
  });
  if (!r.ok) {
    console.error("Email non envoyé", r.status, await r.text());
    return { envoye: false, raison: `Resend ${r.status}` };
  }
  return { envoye: true };
}

// ---------- Mise en page commune ----------
const site = () => env("SITE_URL").replace(/\/$/, "");
function gabarit(titre: string, corps: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f2ee;font-family:Arial,Helvetica,sans-serif;color:#1b1a17">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">
    <div style="text-align:center;padding:8px 0 16px"><img src="${site()}/img/logo-email.png" alt="Mon Truc en Bois" width="110" style="width:110px;height:auto"></div>
    <div style="background:#fff;border-radius:14px;padding:28px 24px">
      <h1 style="font-size:22px;margin:0 0 16px">${echapper(titre)}</h1>
      ${corps}
    </div>
    <p style="text-align:center;color:#5f5a52;font-size:13px;margin-top:18px">Mon Truc en Bois · 3 rue Salengro, 62260 Auchel · <a href="${site()}" style="color:#24453a">${site().replace(/^https?:\/\//, "")}</a></p>
  </div></body></html>`;
}
const bouton = (url: string, texte: string) =>
  `<p style="margin:22px 0"><a href="${echapper(url)}" style="background:#24453a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">${echapper(texte)}</a></p>`;

function recapitulatif(c: any) {
  const lignes = (c.lignes ?? [])
    .map(
      (l: any) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">
          <strong>${echapper(l.nom)}</strong> × ${l.quantite}
          ${l.variante ? `<br><span style="color:#5f5a52">${echapper(l.variante)}</span>` : ""}
          ${l.texte ? `<br><span style="color:#5f5a52">Texte : « ${echapper(l.texte)} »${l.police ? ` (${echapper(l.police)})` : ""}</span>` : ""}
          ${l.photo_nom ? `<br><span style="color:#5f5a52">Photo : ${echapper(l.photo_nom)}</span>` : ""}
          ${l.remarque ? `<br><span style="color:#5f5a52">Précisions : ${echapper(l.remarque)}</span>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${euros(l.total)}</td>
      </tr>`
    )
    .join("");
  const ligne = (libelle: string, montant: number, gras = false) =>
    `<tr><td style="padding:4px 0;${gras ? "font-weight:bold" : ""}">${libelle}</td><td style="padding:4px 0;text-align:right;${gras ? "font-weight:bold" : ""}">${euros(montant)}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:15px">${lignes}
    ${ligne("Sous-total", c.sous_total)}
    ${Number(c.port) ? ligne("Livraison", c.port) : ""}
    ${Number(c.emballage) ? ligne("Emballage cadeau", c.emballage) : ""}
    ${ligne("Total", c.total, true)}
  </table>`;
}
const lienSuivi = (c: any) => `${site()}/suivi.html?jeton=${c.jeton_suivi}`;
const MODES_PAIEMENT: Record<string, string> = {
  en_ligne: "Paiement en ligne par carte",
  apres_validation: "Paiement après validation de la maquette (nous vous envoyons un lien de paiement)",
  boutique: "Paiement à la boutique lors du retrait",
};

// ---------- Emails ----------
export function emailNouvelleCommande(c: any) {
  return {
    sujet: `Nouvelle commande ${c.numero} — ${euros(c.total)}`,
    html: gabarit(`Nouvelle commande ${c.numero}`, `
      <p><strong>${echapper(c.client_nom)}</strong><br>${echapper(c.client_email)} · ${echapper(c.client_tel)}<br>
      ${c.mode_reception === "retrait" ? "Retrait à la boutique" : `Livraison : ${echapper(c.adresse)}`}</p>
      <p>${echapper(MODES_PAIEMENT[c.paiement_mode] ?? c.paiement_mode)}</p>
      ${c.cadeau?.message ? `<p>Message pour la carte : « ${echapper(c.cadeau.message)} »</p>` : ""}
      ${c.cadeau?.date ? `<p>Date souhaitée : ${echapper(new Date(c.cadeau.date).toLocaleDateString("fr-FR"))}</p>` : ""}
      ${c.message ? `<p>Message : ${echapper(c.message)}</p>` : ""}
      ${recapitulatif(c)}
      ${bouton(`${site()}/admin.html#commandes`, "Ouvrir dans l'admin")}`),
  };
}

export function emailConfirmationClient(c: any, paiementUrl?: string) {
  return {
    sujet: `Votre commande ${c.numero} chez Mon Truc en Bois`,
    html: gabarit("Merci pour votre commande !", `
      <p>Bonjour ${echapper(c.client_nom.split(" ")[0])},</p>
      <p>Nous avons bien reçu votre commande <strong>${c.numero}</strong>. Nous revenons vers vous rapidement pour valider la personnalisation (avec une maquette si besoin).</p>
      <p><strong>${echapper(MODES_PAIEMENT[c.paiement_mode] ?? "")}</strong></p>
      ${paiementUrl ? bouton(paiementUrl, "Payer ma commande") : ""}
      ${recapitulatif(c)}
      ${bouton(lienSuivi(c), "Suivre ma commande")}
      <p style="color:#5f5a52;font-size:14px">Une question ? Répondez simplement à cet email.</p>`),
  };
}

export function emailPaiementRecu(c: any) {
  return {
    sujet: `Paiement reçu — commande ${c.numero}`,
    html: gabarit("Paiement bien reçu", `
      <p>Bonjour ${echapper(c.client_nom.split(" ")[0])},</p>
      <p>Nous avons bien reçu votre paiement de <strong>${euros(c.total)}</strong> pour la commande <strong>${c.numero}</strong>${c.facture_numero ? ` (facture ${c.facture_numero})` : ""}. Merci !</p>
      ${bouton(lienSuivi(c), "Suivre ma commande")}`),
  };
}

export function emailPaiementRecuBoutique(c: any) {
  return {
    sujet: `Paiement reçu : ${c.numero} — ${euros(c.total)}`,
    html: gabarit(`Paiement reçu pour ${c.numero}`, `<p>${echapper(c.client_nom)} a payé ${euros(c.total)} en ligne.</p>${bouton(`${site()}/admin.html#commandes`, "Ouvrir dans l'admin")}`),
  };
}

export function emailStatut(c: any, message = "") {
  const textes: Record<string, string> = {
    confirmee: "Votre maquette est validée : nous lançons la fabrication très bientôt.",
    en_fabrication: "Votre création est en cours de fabrication.",
    prete: "Bonne nouvelle : votre commande est prête ! Vous pouvez venir la retirer à la boutique aux heures d'ouverture.",
    expediee: `Votre commande est partie !${c.suivi_colis ? ` Numéro de suivi : <strong>${echapper(c.suivi_colis)}</strong>` : ""}`,
    terminee: "Votre commande est terminée. Merci pour votre confiance ! Un avis nous aiderait beaucoup.",
    annulee: "Votre commande a été annulée. N'hésitez pas à nous contacter pour toute question.",
  };
  return {
    sujet: `Commande ${c.numero} : ${STATUTS[c.statut] ?? c.statut}`,
    html: gabarit(STATUTS[c.statut] ?? "Votre commande", `
      <p>Bonjour ${echapper(c.client_nom.split(" ")[0])},</p>
      <p>${textes[c.statut] ?? "Le statut de votre commande a changé."}</p>
      ${message ? `<p style="background:#f4f2ee;border-radius:10px;padding:12px 14px">${echapper(message).replace(/\n/g, "<br>")}</p>` : ""}
      ${bouton(lienSuivi(c), "Voir ma commande")}`),
  };
}

export function emailLienPaiement(c: any, url: string, message = "") {
  return {
    sujet: `Commande ${c.numero} : votre lien de paiement`,
    html: gabarit("Votre commande est prête à être réglée", `
      <p>Bonjour ${echapper(c.client_nom.split(" ")[0])},</p>
      <p>Voici le lien pour régler votre commande <strong>${c.numero}</strong> (${euros(c.total)}) en toute sécurité par carte bancaire.</p>
      ${message ? `<p style="background:#f4f2ee;border-radius:10px;padding:12px 14px">${echapper(message).replace(/\n/g, "<br>")}</p>` : ""}
      ${bouton(url, `Payer ${euros(c.total)}`)}
      ${recapitulatif(c)}`),
  };
}
