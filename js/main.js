// En-tête, pied de page, panier et utilitaires partagés par toutes les pages.
(function () {
  const S = window.SITE;

  const euros = (n) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const echapper = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ---------- Panier (stocké dans le navigateur) ----------
  const CLE = "panier-mtb";
  const lirePanier = () => {
    try {
      return JSON.parse(localStorage.getItem(CLE)) || [];
    } catch {
      return [];
    }
  };
  const ecrirePanier = (panier) => {
    try {
      localStorage.setItem(CLE, JSON.stringify(panier));
    } catch {
      // Quota dépassé (photos trop lourdes) : on retire les aperçus photo.
      localStorage.setItem(CLE, JSON.stringify(panier.map((l) => ({ ...l, photo: l.photo ? "" : l.photo }))));
    }
    majCompteur();
  };
  const ajouterAuPanier = (ligne) => {
    const panier = lirePanier();
    panier.push({ ...ligne, uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) });
    ecrirePanier(panier);
  };
  const nbArticles = () => lirePanier().reduce((n, l) => n + l.quantite, 0);
  function majCompteur() {
    const el = document.querySelector("[data-compteur]");
    if (!el) return;
    const n = nbArticles();
    el.textContent = n;
    el.hidden = n === 0;
  }

  // ---------- Visuel produit (photo ou illustration générée) ----------
  const TEINTES = { gravure: ["#8b5a2b", "#c89b6d"], serigraphie: ["#2f5d62", "#5e8b7e"], photo: ["#6d4c41", "#d7a86e"], bijoux: ["#7b5e7b", "#c9a7c9"] };
  function visuel(produit) {
    if (produit.image) return `<img src="${echapper(produit.image)}" alt="${echapper(produit.nom)}" loading="lazy">`;
    const [a, b] = TEINTES[produit.categorie] || ["#8b5a2b", "#c89b6d"];
    const icone = window.CATEGORIES[produit.categorie]?.icone || "✨";
    return `<div class="visuel-auto" style="--a:${a};--b:${b}" role="img" aria-label="${echapper(produit.nom)}"><span>${icone}</span></div>`;
  }

  // ---------- En-tête et pied de page ----------
  function entete() {
    const page = location.pathname.split("/").pop() || "index.html";
    const lien = (href, texte) => `<a href="${href}"${page === href ? ' aria-current="page"' : ""}>${texte}</a>`;
    return `
      <div class="conteneur entete-int">
        <a class="logo" href="index.html"><span class="logo-marque">🪵</span><span>${echapper(S.nom)}</span></a>
        <button class="burger" aria-label="Menu" aria-expanded="false">☰</button>
        <nav class="nav">
          ${lien("index.html", "Accueil")}
          ${lien("boutique.html", "Boutique")}
          ${lien("atelier.html", "L'atelier")}
          ${lien("contact.html", "Contact & devis")}
          <a class="lien-panier" href="panier.html" aria-label="Panier">🛒 Panier <span class="compteur" data-compteur hidden>0</span></a>
        </nav>
      </div>`;
  }
  function pied() {
    return `
      <div class="conteneur pied-grille">
        <div>
          <strong>${echapper(S.nom)}</strong>
          <p>${echapper(S.slogan)}</p>
          <p><a href="${echapper(S.facebook)}" target="_blank" rel="noopener">Suivez-nous sur Facebook</a></p>
        </div>
        <div>
          <strong>Contact</strong>
          <p>${echapper(S.adresse)}<br>
          <a href="tel:${S.telephone.replace(/\s/g, "")}">${echapper(S.telephone)}</a><br>
          <a href="mailto:${echapper(S.email)}">${echapper(S.email)}</a></p>
          <p>${echapper(S.horaires)}</p>
        </div>
        <div>
          <strong>Informations</strong>
          <p><a href="cgv.html">Conditions générales de vente</a><br>
          <a href="mentions-legales.html">Mentions légales</a></p>
        </div>
      </div>
      <p class="copyright">© ${new Date().getFullYear()} ${echapper(S.nom)} — Fait main avec ❤️</p>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const h = document.querySelector("header.entete");
    const f = document.querySelector("footer.pied");
    if (h) h.innerHTML = entete();
    if (f) f.innerHTML = pied();
    document.querySelectorAll("[data-site]").forEach((el) => (el.textContent = S[el.dataset.site]));
    const burger = document.querySelector(".burger");
    burger?.addEventListener("click", () => {
      const ouvert = document.querySelector(".nav").classList.toggle("ouvert");
      burger.setAttribute("aria-expanded", ouvert);
    });
    majCompteur();
  });

  window.MTB = { euros, echapper, lirePanier, ecrirePanier, ajouterAuPanier, visuel, majCompteur };
})();
