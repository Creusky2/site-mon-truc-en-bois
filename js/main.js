// En-tête, pied de page, panier et utilitaires partagés par toutes les pages.
// Les contenus (infos, textes, catalogue) viennent de data/donnees.js, modifiable depuis admin.html.
(function () {
  const D = window.DONNEES;
  const S = D.site;

  // Raccourcis utilisés par les pages
  window.SITE = S;
  window.CATEGORIES = Object.fromEntries(D.categories.map((c) => [c.id, c]));
  window.PRODUITS = D.produits.filter((p) => p.visible !== false);
  window.trouverProduit = (id) => window.PRODUITS.find((p) => p.id === id);

  const euros = (n) => Number(n || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const echapper = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const telLien = (t) => "tel:" + String(t).replace(/[^\d+]/g, "");

  // ---------- Icônes (traits simples) ----------
  const TRACES = {
    panier: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/>',
    tel: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    lieu: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    horloge: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    fleche: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    main: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5V4.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V13a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3 14a1.6 1.6 0 0 1 2.6-1.8L8 15"/>',
    eclat: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    crayon: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
    boutique: '<path d="M4 10v10h16V10"/><path d="M3 10 5 4h14l2 6"/><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/>',
    camion: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>',
    coche: '<path d="m5 12 5 5L20 7"/>',
    facebook: '<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h3l.5-4H12V8a1 1 0 0 1 1-1h2z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/>',
    gravure: '<path d="M14 4l6 6-9 9H5v-6z"/><path d="M4 21h16"/>',
    tshirt: '<path d="M8 4 4 6l1.5 4L8 9v11h8V9l2.5 1L20 6l-4-2a4 4 0 0 1-8 0z"/>',
    fete: '<path d="m4 20 5-14 9 9z"/><path d="M14 4c1 1 1 2 0 3M19 9c1-1 2-1 3 0M17 3l.5 1.5M21 6l-1.5.5"/>',
    bijou: '<circle cx="12" cy="14" r="6"/><path d="m9 4 3 4 3-4z"/>',
  };
  const icone = (nom, cls = "ico") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${TRACES[nom] || ""}</svg>`;
  const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#a8693a"/><circle cx="20" cy="20" r="14" fill="none" stroke="#f1dcc3" stroke-width="1.6"/><circle cx="20.5" cy="19.5" r="9" fill="none" stroke="#f1dcc3" stroke-width="1.4"/><circle cx="21" cy="19" r="4.2" fill="none" stroke="#f1dcc3" stroke-width="1.2"/><circle cx="21.2" cy="18.8" r="1.1" fill="#f1dcc3"/></svg>`;

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
      try {
        localStorage.setItem(CLE, JSON.stringify(panier.map((l) => ({ ...l, photo: "" }))));
      } catch {}
    }
    majCompteur();
  };
  const ajouterAuPanier = (ligne) => {
    const panier = lirePanier();
    panier.push({ ...ligne, uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) });
    ecrirePanier(panier);
  };
  function majCompteur() {
    const el = document.querySelector("[data-compteur]");
    if (!el) return;
    const n = lirePanier().reduce((t, l) => t + l.quantite, 0);
    el.textContent = n;
    el.hidden = n === 0;
  }

  // ---------- Produits ----------
  function visuel(produit) {
    if (produit.image) return `<img src="${echapper(produit.image)}" alt="${echapper(produit.nom)}" loading="lazy">`;
    return `<div class="vide-image" role="img" aria-label="${echapper(produit.nom)}">${icone("image", "")}</div>`;
  }
  const aPartirDe = (p) => p.variantes?.choix?.some((c) => c.prix) ? "<small>dès</small> " : "";
  function carteProduit(p) {
    const cat = window.CATEGORIES[p.categorie];
    return `
      <a class="produit-carte" href="produit.html?id=${encodeURIComponent(p.id)}">
        <div class="produit-image">${visuel(p)}</div>
        <div class="produit-infos">
          ${cat ? `<span class="etiquette">${echapper(cat.nom)}</span>` : ""}
          <h3>${echapper(p.nom)}</h3>
          <span class="prix">${aPartirDe(p)}${euros(p.prix)}</span>
        </div>
      </a>`;
  }

  // ---------- Horaires : « Mardi : 9h – 18h » → ligne, jour courant en évidence ----------
  function horairesHTML() {
    const jour = new Date().toLocaleDateString("fr-FR", { weekday: "long" }).toLowerCase();
    return `<ul class="horaires">${S.horaires
      .map((h) => {
        const i = h.indexOf(":");
        const [j, v] = i > 0 ? [h.slice(0, i).trim(), h.slice(i + 1).trim()] : [h, ""];
        return `<li class="${j.toLowerCase() === jour ? "aujourdhui" : ""}"><span>${echapper(j)}</span><span>${echapper(v)}</span></li>`;
      })
      .join("")}</ul>`;
  }

  // ---------- En-tête et pied de page ----------
  function entete() {
    const page = location.pathname.split("/").pop() || "index.html";
    const lien = (href, texte) => `<a href="${href}"${page === href ? ' aria-current="page"' : ""}>${texte}</a>`;
    return `
      <div class="conteneur entete-int">
        <a class="logo" href="index.html" aria-label="${echapper(S.nom)} — accueil">${LOGO}<span><span class="logo-nom">${echapper(S.nom)}</span><span class="logo-lieu">Personnalisation · Auchel</span></span></a>
        <button class="burger" aria-label="Menu" aria-expanded="false">${icone("menu")}</button>
        <nav class="nav" aria-label="Navigation principale">
          ${lien("index.html", "Accueil")}
          ${lien("boutique.html", "Boutique")}
          ${lien("atelier.html", "Qui sommes-nous ?")}
          ${lien("contact.html", "Contact & devis")}
          <a class="lien-panier" href="panier.html"${page === "panier.html" ? ' aria-current="page"' : ""}>${icone("panier")} Panier <span class="compteur" data-compteur hidden>0</span></a>
        </nav>
      </div>`;
  }
  function pied() {
    return `
      <div class="conteneur">
        <div class="pied-grille">
          <div class="pile">
            <a class="logo" href="index.html">${LOGO}<span><span class="logo-nom">${echapper(S.nom)}</span><span class="logo-lieu">Personnalisation · Auchel</span></span></a>
            <p style="margin-top:.6rem">${echapper(S.slogan)}</p>
          </div>
          <div class="pile">
            <h4>Boutique</h4>
            <span>${echapper(S.adresse)}</span>
            <a href="${telLien(S.telephone)}">${echapper(S.telephone)}</a>
            <a href="mailto:${echapper(S.email)}">${echapper(S.email)}</a>
            <a href="${echapper(S.facebook)}" target="_blank" rel="noopener">Facebook</a>
          </div>
          <div class="pile">
            <h4>Horaires</h4>
            ${S.horaires.map((h) => `<span>${echapper(h)}</span>`).join("")}
          </div>
          <div class="pile">
            <h4>Le site</h4>
            <a href="boutique.html">Boutique</a>
            <a href="contact.html">Demande de devis</a>
            <a href="cgv.html">Conditions générales de vente</a>
            <a href="mentions-legales.html">Mentions légales</a>
          </div>
        </div>
        <div class="pied-bas"><span>© ${new Date().getFullYear()} ${echapper(S.nom)}</span><span>Fait main à Auchel</span></div>
      </div>`;
  }

  function bandeaux() {
    const html = [];
    if (S.apercu)
      html.push(`<div class="bandeau-info bandeau-apercu">Site en construction — les prix sont provisoires et les commandes en ligne ne sont pas encore ouvertes. Contactez-nous au ${echapper(S.telephone)}.</div>`);
    if (D.annonce?.actif && D.annonce.texte) html.push(`<div class="bandeau-info bandeau-annonce">${echapper(D.annonce.texte)}</div>`);
    if (html.length) document.body.insertAdjacentHTML("afterbegin", html.join(""));
  }

  // Mode aperçu : les formulaires de commande et de devis ne partent pas.
  if (S.apercu) {
    document.addEventListener(
      "submit",
      (e) => {
        if (!["commande", "devis"].includes(e.target.id)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        let m = e.target.querySelector(".message-apercu");
        if (!m) {
          m = document.createElement("p");
          m.className = "message message-alerte message-apercu";
          e.target.append(m);
        }
        m.textContent = `Le site est encore en construction : l'envoi en ligne n'est pas encore ouvert. Appelez-nous au ${S.telephone} ou écrivez-nous sur Facebook.`;
      },
      true
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    const h = document.querySelector("header.entete");
    const f = document.querySelector("footer.pied");
    if (h) h.innerHTML = entete();
    if (f) f.innerHTML = pied();
    bandeaux();
    document.querySelectorAll("[data-site]").forEach((el) => (el.textContent = S[el.dataset.site] ?? ""));
    document.querySelectorAll("[data-texte]").forEach((el) => (el.textContent = D.textes?.[el.dataset.texte] ?? ""));
    document.querySelectorAll("[data-icone]").forEach((el) => el.insertAdjacentHTML("afterbegin", icone(el.dataset.icone)));
    document.querySelectorAll("[data-horaires]").forEach((el) => (el.innerHTML = horairesHTML()));
    document.querySelectorAll("[data-tel]").forEach((el) => {
      el.href = telLien(S.telephone);
      el.insertAdjacentText("beforeend", S.telephone);
    });
    document.querySelectorAll("[data-mail]").forEach((el) => {
      el.href = "mailto:" + S.email;
      el.insertAdjacentText("beforeend", S.email);
    });
    document.querySelectorAll("[data-facebook]").forEach((el) => (el.href = S.facebook));
    const burger = document.querySelector(".burger");
    burger?.addEventListener("click", () => {
      const ouvert = document.querySelector(".nav").classList.toggle("ouvert");
      burger.setAttribute("aria-expanded", ouvert);
    });
    majCompteur();
  });

  window.MTB = { D, euros, echapper, icone, lirePanier, ecrirePanier, ajouterAuPanier, visuel, carteProduit, majCompteur, telLien };
})();
