// Administration du site : lit data/donnees.js sur GitHub, le modifie via des formulaires,
// puis le republie (commit) avec l'API GitHub. Les photos ajoutées sont envoyées dans img/.
(function () {
  const FICHIER = "data/donnees.js";
  const PREFIXE = "window.DONNEES = ";
  const ENTETE =
    "// ============================================================\n" +
    "//  DONNÉES DU SITE — modifiées depuis la page admin (admin.html).\n" +
    "//  On peut aussi éditer ce fichier à la main : il doit rester du JSON valide après « window.DONNEES = ».\n" +
    "// ============================================================\n";
  const DEFAUT = { proprio: "Creusky2", depot: "site-mon-truc-en-bois", branche: "site-vitrine-boutique" };
  const CLE_STOCKAGE = "admin-mtb";
  const CLE_BROUILLON = "brouillon-mtb"; // aussi lu par le site pour la prévisualisation
  const EMAIL_PROVISOIRE = "contact@montrucenbois.fr";
  const BADGES = { "": "Aucun", nouveau: "Nouveau", promo: "Promo", best: "Best-seller", edition: "Édition limitée" };
  const DISPOS = { disponible: "Disponible", commande: "Fabriqué sur commande", epuise: "Épuisé" };

  const $ = (s, el = document) => el.querySelector(s);
  const echapper = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const euros = (n) => Number(n || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const slug = (s) =>
    String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "element";

  // ---------- Réglages de connexion ----------
  let cfg = { ...DEFAUT, cle: "" };
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE) || sessionStorage.getItem(CLE_STOCKAGE);
    if (brut) cfg = { ...cfg, ...JSON.parse(brut) };
  } catch {}
  function enregistrerCfg(souvenir) {
    try {
      localStorage.removeItem(CLE_STOCKAGE);
      sessionStorage.removeItem(CLE_STOCKAGE);
      (souvenir ? localStorage : sessionStorage).setItem(CLE_STOCKAGE, JSON.stringify(cfg));
    } catch {}
  }
  const lienGithub = (chemin) => `https://github.com/${cfg.proprio}/${cfg.depot}/${chemin}`;

  // ---------- API GitHub ----------
  async function api(chemin, options = {}) {
    const r = await fetch(`https://api.github.com/repos/${cfg.proprio}/${cfg.depot}${chemin}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${cfg.cle}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!r.ok) {
      const e = new Error(`GitHub ${r.status}`);
      e.status = r.status;
      try {
        e.detail = (await r.json()).message;
      } catch {}
      throw e;
    }
    return r.json();
  }
  const versBase64 = (texte) => {
    const octets = new TextEncoder().encode(texte);
    let bin = "";
    for (let i = 0; i < octets.length; i += 0x8000) bin += String.fromCharCode(...octets.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  const depuisBase64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
  const cheminContenu = (f) => `/contents/${f.split("/").map(encodeURIComponent).join("/")}`;

  async function chargerDonnees() {
    const f = await api(`${cheminContenu(FICHIER)}?ref=${encodeURIComponent(cfg.branche)}&t=${Date.now()}`);
    const texte = depuisBase64(f.content);
    // La ligne de données commence par « window.DONNEES = » (le commentaire d'en-tête aussi contient ces mots).
    const i = texte.search(/^window\.DONNEES = /m);
    if (i < 0) throw new Error("Le fichier de données n'a pas le format attendu.");
    const json = texte.slice(i + PREFIXE.length).trim().replace(/;\s*$/, "");
    return { donnees: JSON.parse(json), sha: f.sha };
  }
  async function envoyerFichier(chemin, contenuBase64, message, sha) {
    return api(cheminContenu(chemin), {
      method: "PUT",
      body: JSON.stringify({ message, content: contenuBase64, branch: cfg.branche, ...(sha ? { sha } : {}) }),
    });
  }

  // ---------- État ----------
  let D = null; // données en cours d'édition
  let sha = null;
  let modifie = false;
  let onglet = "accueil";
  let filtre = { q: "", cat: "" };
  const apercusLocaux = {}; // chemin image → dataURL (photos envoyées mais pas encore en ligne)

  // Complète les champs ajoutés au fil des versions, pour que l'admin et le site s'y retrouvent.
  function normaliser(d) {
    d.site ||= {};
    d.site.horaires ||= [];
    d.site.emballage ||= { actif: false, prix: 0 };
    d.site.plateformesAvis ||= {};
    d.site.plateformesAvis.facebook ||= { lien: "", taux: 100, nombre: 0 };
    d.site.plateformesAvis.google ||= { lien: "", lienAvis: "", note: 0, nombre: 0 };
    d.produits ||= [];
    d.categories ||= [];
    d.occasions ||= [];
    d.galerie ||= [];
    d.avis ||= [];
    d.faq ||= [];
    d.textes ||= {};
    d.annonce ||= { actif: false, texte: "", lien: "" };
    d.produits.forEach((p) => {
      p.images ||= p.image ? [p.image] : [];
      p.occasions ||= [];
      p.options ||= {};
      p.dispo ||= "disponible";
    });
    return d;
  }

  // Brouillon local : protège contre une fermeture accidentelle et sert à la prévisualisation.
  let minuteurBrouillon;
  function garderBrouillon() {
    try {
      localStorage.setItem(CLE_BROUILLON, JSON.stringify({ donnees: D, sha, date: Date.now(), depot: `${cfg.proprio}/${cfg.depot}/${cfg.branche}` }));
    } catch {}
  }
  const oublierBrouillon = () => {
    try {
      localStorage.removeItem(CLE_BROUILLON);
    } catch {}
  };

  function marquerModifie() {
    modifie = true;
    majStatut();
    clearTimeout(minuteurBrouillon);
    minuteurBrouillon = setTimeout(garderBrouillon, 400);
  }
  function majStatut(texte) {
    const s = $("#statut");
    s.textContent = texte || (modifie ? "Modifications non publiées" : "À jour");
    s.classList.toggle("modifie", modifie && !texte);
    $("#publier").disabled = !modifie;
  }
  let minuteurToast;
  function toast(msg, erreur = false) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.toggle("erreur", erreur);
    t.hidden = false;
    clearTimeout(minuteurToast);
    minuteurToast = setTimeout(() => (t.hidden = true), erreur ? 7000 : 4000);
  }
  const srcImage = (chemin) => apercusLocaux[chemin] || chemin;
  const vignette = (chemin) =>
    chemin ? `<span class="ligne-image"><img src="${echapper(srcImage(chemin))}" alt="" loading="lazy"></span>` : `<span class="ligne-image">Sans photo</span>`;
  const premiereImage = (p) => p.images?.[0] || p.image || "";

  // ---------- Photos : redimensionnement puis envoi dans img/ ----------
  function redimensionner(fichier, max = 1200) {
    return new Promise((ok, ko) => {
      const img = new Image();
      img.onload = () => {
        const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * r);
        c.height = Math.round(img.height * r);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        ok(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => ko(new Error("Image illisible"));
      img.src = URL.createObjectURL(fichier);
    });
  }
  async function envoyerPhoto(fichier, nomBase) {
    toast("Envoi de la photo…");
    const dataUrl = await redimensionner(fichier);
    const chemin = `img/${slug(nomBase)}-${Date.now().toString(36)}.jpg`;
    await envoyerFichier(chemin, dataUrl.split(",")[1], `Ajout de la photo ${chemin} (admin)`);
    apercusLocaux[chemin] = dataUrl;
    toast("Photo ajoutée.");
    return chemin;
  }

  // ---------- Connexion ----------
  function afficherConnexion(erreur) {
    $("#app").hidden = true;
    $("#connexion").hidden = false;
    $("#cle").value = cfg.cle || "";
    $("#cfg-proprio").value = cfg.proprio;
    $("#cfg-depot").value = cfg.depot;
    $("#cfg-branche").value = cfg.branche;
    $("#erreur-connexion").innerHTML = erreur ? `<p class="message message-alerte">${echapper(erreur)}</p>` : "";
  }
  async function demarrer() {
    $("#erreur-connexion").innerHTML = `<p class="aide">Connexion…</p>`;
    try {
      const depot = await api("");
      if (!depot.permissions?.push) throw Object.assign(new Error("droits"), { status: 403 });
      ({ donnees: D, sha } = await chargerDonnees());
    } catch (e) {
      const msg =
        e.status === 401 ? "Clé refusée par GitHub : vérifiez qu'elle est complète et pas expirée."
        : e.status === 403 ? "Cette clé n'a pas le droit de modifier le dépôt : donnez-lui la permission « Contents : Read and write »."
        : e.status === 404 ? "Dépôt, branche ou fichier introuvable : vérifiez les réglages avancés et que la clé donne accès au dépôt."
        : `Connexion impossible (${e.message}).`;
      afficherConnexion(msg);
      return;
    }
    normaliser(D);
    modifie = false;

    // Brouillon non publié laissé lors d'une session précédente ?
    try {
      const b = JSON.parse(localStorage.getItem(CLE_BROUILLON) || "null");
      if (b && JSON.stringify(b.donnees) !== JSON.stringify(D)) {
        const quand = new Date(b.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
        if (b.sha === sha && confirm(`Des modifications non publiées du ${quand} ont été retrouvées sur cet appareil. Les reprendre ?`)) {
          D = normaliser(b.donnees);
          modifie = true;
        } else oublierBrouillon();
      }
    } catch {}

    $("#connexion").hidden = true;
    $("#app").hidden = false;
    majStatut();
    rendre();
  }

  $("#form-connexion").addEventListener("submit", (e) => {
    e.preventDefault();
    cfg = {
      cle: $("#cle").value.trim(),
      proprio: $("#cfg-proprio").value.trim() || DEFAUT.proprio,
      depot: $("#cfg-depot").value.trim() || DEFAUT.depot,
      branche: $("#cfg-branche").value.trim() || DEFAUT.branche,
    };
    enregistrerCfg($("#souvenir").checked);
    demarrer();
  });
  $("#deconnexion").addEventListener("click", () => {
    if (modifie && !confirm("Des modifications ne sont pas publiées (elles restent gardées sur cet appareil). Se déconnecter quand même ?")) return;
    cfg.cle = "";
    try {
      localStorage.removeItem(CLE_STOCKAGE);
      sessionStorage.removeItem(CLE_STOCKAGE);
    } catch {}
    modifie = false;
    afficherConnexion();
  });
  addEventListener("beforeunload", (e) => {
    if (modifie) e.preventDefault();
  });

  // ---------- Prévisualisation et publication ----------
  $("#previsualiser").addEventListener("click", () => {
    garderBrouillon();
    open("index.html?brouillon=1", "_blank");
  });

  $("#publier").addEventListener("click", async () => {
    const b = $("#publier");
    b.disabled = true;
    majStatut("Publication…");
    try {
      D.produits.forEach((p) => (p.image = p.images?.[0] || ""));
      const texte = ENTETE + PREFIXE + JSON.stringify(D, null, 2) + ";\n";
      const r = await envoyerFichier(FICHIER, versBase64(texte), "Mise à jour du contenu du site (admin)", sha);
      sha = r.content.sha;
      modifie = false;
      oublierBrouillon();
      majStatut();
      if (onglet === "accueil") rendre();
      toast("Publié ! Le site sera à jour d'ici quelques minutes (rechargez la page du site).");
    } catch (e) {
      majStatut();
      b.disabled = false;
      if (e.status === 409 || e.status === 422)
        toast("Le site a été modifié ailleurs entre-temps. Rechargez la page admin : vos modifications vous seront proposées à nouveau.", true);
      else toast(`Échec de la publication (${e.detail || e.message}).`, true);
    }
  });

  // ---------- Onglets ----------
  function allerA(nom) {
    onglet = nom;
    document.querySelectorAll(".onglets button").forEach((x) => x.setAttribute("aria-selected", x.dataset.onglet === nom));
    rendre();
    scrollTo(0, 0);
  }
  document.querySelector(".onglets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-onglet]");
    if (b) allerA(b.dataset.onglet);
  });

  const VUES = {
    accueil: () => vueAccueil(),
    produits: () => vueProduits(),
    categories: () => vueCategories() + vueOccasions(),
    avis: () => vueAvis(),
    faq: () => vueFaq(),
    boutique: () => vueBoutique(),
    textes: () => vueTextes(),
    galerie: () => vueGalerie(),
  };
  const rendre = () => ($("#contenu").innerHTML = VUES[onglet]());

  // Champs simples liés aux données : data-chemin="site.telephone", data-type="nombre|lignes|case"
  const lire = (chemin) => chemin.split(".").reduce((o, k) => o?.[k], D);
  function ecrire(chemin, valeur) {
    const cles = chemin.split(".");
    const dernier = cles.pop();
    const cible = cles.reduce((o, k) => (o[k] ??= {}), D);
    cible[dernier] = valeur;
  }
  function champ(chemin, libelle, { type = "text", aide = "", large = false, lignes = 0, placeholder = "" } = {}) {
    const v = lire(chemin);
    const id = "f-" + chemin.replace(/\./g, "-");
    let entree;
    if (type === "case")
      return `<label class="case ${large ? "large" : ""}"><input type="checkbox" id="${id}" data-chemin="${chemin}" data-type="case" ${v ? "checked" : ""}> <span>${libelle}${aide ? `<br><small class="aide">${aide}</small>` : ""}</span></label>`;
    if (type === "lignes")
      entree = `<textarea id="${id}" data-chemin="${chemin}" data-type="lignes" rows="${lignes || 7}">${echapper((v || []).join("\n"))}</textarea>`;
    else if (type === "zone") entree = `<textarea id="${id}" data-chemin="${chemin}" rows="${lignes || 3}">${echapper(v)}</textarea>`;
    else
      entree = `<input type="${type === "nombre" ? "number" : type}" ${type === "nombre" ? 'step="0.01" min="0" data-type="nombre"' : ""} id="${id}" data-chemin="${chemin}" value="${echapper(v)}" placeholder="${echapper(placeholder)}">`;
    return `<div class="champ ${large ? "large" : ""}"><label for="${id}">${libelle}</label>${entree}${aide ? `<small>${aide}</small>` : ""}</div>`;
  }

  // Saisie dans les onglets : champs simples, listes éditables (avis, FAQ, occasions), prix rapide
  $("#contenu").addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.chemin) {
      const t = el.dataset.type;
      const v = t === "case" ? el.checked : t === "nombre" ? Number(el.value || 0) : t === "lignes" ? el.value.split("\n").map((x) => x.trim()).filter(Boolean) : el.value;
      ecrire(el.dataset.chemin, v);
      marquerModifie();
      if (el.dataset.rendre !== undefined) rendre();
    } else if (el.dataset.liste) {
      const item = D[el.dataset.liste][el.dataset.i];
      item[el.dataset.champ] = el.dataset.type === "nombre" ? Number(el.value || 0) : el.value;
      marquerModifie();
    } else if (el.dataset.prix !== undefined) {
      D.produits[el.dataset.prix].prix = Number(el.value || 0);
      marquerModifie();
    } else if (el.id === "filtre-q") {
      filtre.q = el.value;
      const pos = el.selectionStart;
      rendre();
      const q = $("#filtre-q");
      q.focus();
      q.setSelectionRange(pos, pos);
    }
  });
  $("#contenu").addEventListener("change", async (e) => {
    const el = e.target;
    if (el.id === "filtre-cat") {
      filtre.cat = el.value;
      rendre();
    }
    if (el.id === "g-ajout") {
      for (const fichier of el.files) {
        try {
          D.galerie.push(await envoyerPhoto(fichier, "realisation"));
          marquerModifie();
        } catch (err) {
          toast(`Échec de l'envoi d'une photo (${err.detail || err.message}).`, true);
        }
      }
      rendre();
    }
    if (el.id === "restaurer") {
      const fichier = el.files[0];
      if (!fichier) return;
      try {
        const d = JSON.parse(await fichier.text());
        if (!Array.isArray(d.produits) || !Array.isArray(d.categories) || !d.site) throw new Error("format");
        if (!confirm(`Remplacer tout le contenu actuel par la sauvegarde « ${fichier.name} » ? (Rien n'est publié tant que vous ne cliquez pas sur « Publier ».)`)) return;
        D = normaliser(d);
        marquerModifie();
        rendre();
        toast("Sauvegarde chargée. Vérifiez puis publiez.");
      } catch {
        toast("Ce fichier n'est pas une sauvegarde du site.", true);
      }
    }
  });

  // ---------- Vue : Tableau de bord ----------
  function vueAccueil() {
    const visibles = D.produits.filter((p) => p.visible !== false);
    const sansPhoto = D.produits.filter((p) => !premiereImage(p));
    const emailOk = D.site.email && D.site.email !== EMAIL_PROVISOIRE;
    const pret = emailOk && D.site.prixVerifies;
    const etape = (etat, titre, detail, action = "") =>
      `<li><span class="etat ${etat}">${etat === "ok" ? "✓" : etat === "afaire" ? "!" : "·"}</span><span>${titre}${detail ? `<small>${detail}</small>` : ""}</span>${action}</li>`;
    const aller = (o, t) => `<button class="mini" data-aller="${o}">${t}</button>`;
    return `
      <div class="chiffres-admin">
        <div class="chiffre"><strong>${visibles.length}</strong><span>produits en ligne</span></div>
        <div class="chiffre"><strong>${D.produits.filter((p) => p.vedette).length}</strong><span>coups de cœur</span></div>
        <div class="chiffre"><strong>${D.produits.filter((p) => p.prixBarre > p.prix || p.badge === "promo").length}</strong><span>en promotion</span></div>
        <div class="chiffre"><strong>${D.avis.length}</strong><span>avis clients affichés</span></div>
      </div>

      <section class="bloc">
        <div class="bloc-tete">
          <h2>Avant d'ouvrir les commandes</h2>
          ${D.site.apercu ? `<button class="btn" data-action="ouvrir-commandes" ${pret ? "" : "disabled"} title="${pret ? "" : "Complétez d'abord l'email et la vérification des prix"}">Ouvrir les commandes</button>` : `<span class="pastille" style="background:#e3f1e9;color:#1f6b45">Commandes ouvertes</span>`}
        </div>
        <ul class="checklist">
          ${etape(emailOk ? "ok" : "afaire", "Adresse email de la boutique", emailOk ? echapper(D.site.email) : "L'adresse actuelle est provisoire : les commandes s'y perdraient.", emailOk ? "" : aller("boutique", "Corriger"))}
          ${etape(D.site.prixVerifies ? "ok" : "afaire", "Prix vérifiés", "Les prix de départ sont des exemples.", `<label class="case"><input type="checkbox" data-chemin="site.prixVerifies" data-type="case" data-rendre ${D.site.prixVerifies ? "checked" : ""}> Vérifiés</label>`)}
          ${etape(sansPhoto.length ? "afaire" : "ok", "Photos des produits", sansPhoto.length ? `${sansPhoto.length} produit(s) sans photo : ${sansPhoto.slice(0, 3).map((p) => echapper(p.nom)).join(", ")}${sansPhoto.length > 3 ? "…" : ""}` : "Tous les produits ont une photo.", sansPhoto.length ? aller("produits", "Voir") : "")}
          ${etape(D.avis.length >= 3 ? "ok" : "afaire", "Avis clients", D.avis.length >= 3 ? `${D.avis.length} avis affichés sur l'accueil.` : "Recopiez 3 avis de votre page Facebook : ils rassurent les nouveaux clients.", aller("avis", D.avis.length ? "Gérer" : "Ajouter"))}
          ${etape(D.site.plateformesAvis.google.lienAvis || D.site.plateformesAvis.google.lien ? "ok" : "option", "Avis Google reliés au site", D.site.plateformesAvis.google.lienAvis || D.site.plateformesAvis.google.lien ? "Les boutons « Laisser un avis Google » et la carte QR sont actifs." : "Ajoutez le lien de votre fiche Google : bouton « Laisser un avis » et carte QR à imprimer.", aller("avis", "Régler"))}
          ${etape(D.site.formulaireCommande ? "ok" : "option", "Réception des commandes par email (Formspree)", D.site.formulaireCommande ? "Activée." : "Recommandé : sans cela, le client doit envoyer lui-même l'email depuis sa messagerie.", D.site.formulaireCommande ? "" : aller("boutique", "Régler"))}
          ${etape(D.site.whatsapp ? "ok" : "option", "Commandes et questions par WhatsApp", D.site.whatsapp ? `Numéro : ${echapper(D.site.whatsapp)}` : "Facultatif : ajoute un bouton « Commander par WhatsApp » et un bouton de contact.", D.site.whatsapp ? "" : aller("boutique", "Ajouter"))}
          ${etape("option", "Pages légales (CGV, mentions légales)", "À compléter une fois : SIRET, forme juridique, médiateur…", `<a class="mini" style="display:inline-grid;place-items:center;text-decoration:none" href="${lienGithub(`edit/${cfg.branche}/cgv.html`)}" target="_blank" rel="noopener">Modifier sur GitHub</a>`)}
        </ul>
      </section>

      <section class="bloc">
        <div class="bloc-tete"><h2>Raccourcis</h2></div>
        <div class="raccourcis">
          <button class="btn" data-action="nouveau-produit">+ Ajouter un produit</button>
          <button class="btn btn-ligne" data-aller="textes">Écrire une annonce (fermeture, salon…)</button>
          <a class="btn btn-ligne" href="index.html" target="_blank" rel="noopener">Voir le site en ligne</a>
        </div>
      </section>

      <section class="bloc">
        <div class="bloc-tete"><h2>Sauvegarde et historique</h2></div>
        <p class="aide">Chaque publication est conservée par GitHub : en cas d'erreur, l'historique permet de retrouver une ancienne version. Vous pouvez aussi garder une copie du contenu sur votre ordinateur.</p>
        <div class="raccourcis">
          <button class="btn btn-ligne" data-action="telecharger">Télécharger une sauvegarde</button>
          <span class="btn btn-ligne bouton-fichier">Restaurer une sauvegarde<input type="file" accept="application/json,.json" id="restaurer" aria-label="Restaurer une sauvegarde"></span>
          <a class="btn btn-ligne" href="${lienGithub(`commits/${cfg.branche}/${FICHIER}`)}" target="_blank" rel="noopener">Historique des publications</a>
        </div>
      </section>`;
  }

  // ---------- Vue : Produits ----------
  function vueProduits() {
    const cats = Object.fromEntries(D.categories.map((c) => [c.id, c.nom]));
    const q = filtre.q.toLowerCase();
    const liste = D.produits
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => (!filtre.cat || p.categorie === filtre.cat) && (!q || p.nom.toLowerCase().includes(q)));
    return `
      <section class="bloc">
        <div class="bloc-tete">
          <h2>Produits <span class="aide">(${D.produits.length})</span></h2>
          <button class="btn" data-action="nouveau-produit">+ Ajouter un produit</button>
        </div>
        <p class="aide">Modifiez les prix directement dans la liste. ♥ = coup de cœur sur l'accueil, 👁 = visible sur le site.</p>
        <div class="barre">
          <input type="search" id="filtre-q" placeholder="Rechercher…" value="${echapper(filtre.q)}" aria-label="Rechercher un produit">
          <select id="filtre-cat" aria-label="Filtrer par catégorie">
            <option value="">Toutes les catégories</option>
            ${D.categories.map((c) => `<option value="${echapper(c.id)}" ${filtre.cat === c.id ? "selected" : ""}>${echapper(c.nom)}</option>`).join("")}
          </select>
        </div>
        <div class="liste">
          ${liste
            .map(
              ({ p, i }) => `
            <div class="ligne ligne-produit ${p.visible === false ? "masque" : ""}">
              ${vignette(premiereImage(p))}
              <div class="ligne-texte">
                <strong>${echapper(p.nom)}<span class="pastilles">${p.badge ? `<span class="pastille">${BADGES[p.badge] || p.badge}</span>` : ""}${p.dispo && p.dispo !== "disponible" ? `<span class="pastille cache">${DISPOS[p.dispo]}</span>` : ""}${p.visible === false ? '<span class="pastille cache">Masqué</span>' : ""}</span></strong>
                <span>${echapper(cats[p.categorie] || "Sans catégorie")}${p.images?.length > 1 ? ` · ${p.images.length} photos` : ""}</span>
              </div>
              <div class="rapide">
                <input class="prix-rapide" type="number" step="0.01" min="0" value="${Number(p.prix || 0)}" data-prix="${i}" aria-label="Prix de ${echapper(p.nom)}" title="Prix (€)"> €
                <button class="mini" data-action="basculer-vedette" data-i="${i}" aria-pressed="${!!p.vedette}" title="Coup de cœur" aria-label="Coup de cœur">♥</button>
                <button class="mini oeil" data-action="basculer-visible" data-i="${i}" aria-pressed="${p.visible !== false}" title="Visible sur le site" aria-label="Visible sur le site">👁</button>
              </div>
              <div class="ligne-boutons">
                <button class="mini" data-action="monter" data-i="${i}" ${i === 0 ? "disabled" : ""} title="Monter" aria-label="Monter">↑</button>
                <button class="mini" data-action="descendre" data-i="${i}" ${i === D.produits.length - 1 ? "disabled" : ""} title="Descendre" aria-label="Descendre">↓</button>
                <button class="mini" data-action="modifier-produit" data-i="${i}">Modifier</button>
                <button class="mini" data-action="dupliquer-produit" data-i="${i}">Dupliquer</button>
                <button class="mini danger" data-action="supprimer-produit" data-i="${i}">Supprimer</button>
              </div>
            </div>`
            )
            .join("") || `<p class="aide" style="padding:1rem 0">Aucun produit.</p>`}
        </div>
      </section>`;
  }

  function idUnique(base, liste, sauf = -1) {
    let id = slug(base);
    let n = 2;
    while (liste.some((x, i) => x.id === id && i !== sauf)) id = `${slug(base)}-${n++}`;
    return id;
  }

  // Fenêtre d'édition d'un produit (travaille sur une copie, appliquée à « Valider »)
  function editerProduit(index) {
    const nouveau = index < 0;
    const p = nouveau
      ? { id: "", nom: "", categorie: D.categories[0]?.id || "", prix: 0, images: [], description: "", options: { texte: true, photo: false }, visible: true, vedette: false, occasions: [], dispo: "disponible", badge: "", prixBarre: 0, delai: 0, instructions: "" }
      : structuredClone(D.produits[index]);
    p.options ||= {};
    p.images ||= p.image ? [p.image] : [];
    p.occasions ||= [];
    p.variantes ||= { nom: "", choix: [] };
    const f = $("#fenetre");
    const lignesVariantes = () =>
      p.variantes.choix
        .map(
          (c, k) => `
        <div class="variante-ligne">
          <input type="text" data-v="nom" data-k="${k}" value="${echapper(c.nom)}" placeholder="Ex. : Grande" aria-label="Nom du choix">
          <input type="number" step="0.01" min="0" data-v="prix" data-k="${k}" value="${Number(c.prix || 0)}" aria-label="Supplément en euros" title="Supplément (€)">
          <button type="button" class="mini danger" data-v-suppr="${k}" aria-label="Retirer ce choix">✕</button>
        </div>`
        )
        .join("");
    const lignesPhotos = () =>
      p.images
        .map(
          (src, k) => `
        <div class="photo-edit">
          <img src="${echapper(srcImage(src))}" alt="Photo ${k + 1}">
          <div class="ligne-boutons">
            <button type="button" class="mini" data-ph="gauche" data-k="${k}" ${k === 0 ? "disabled" : ""} aria-label="Avancer">←</button>
            <button type="button" class="mini" data-ph="droite" data-k="${k}" ${k === p.images.length - 1 ? "disabled" : ""} aria-label="Reculer">→</button>
            <button type="button" class="mini danger" data-ph="suppr" data-k="${k}" aria-label="Retirer">✕</button>
          </div>
        </div>`
        )
        .join("") + `<label class="ajout-photo">+ Ajouter<br>des photos<input type="file" accept="image/*" multiple id="p-photos" aria-label="Ajouter des photos"></label>`;
    f.innerHTML = `
      <form method="dialog" id="form-produit">
        <h2 style="font-size:1.35rem">${nouveau ? "Nouveau produit" : "Modifier le produit"}</h2>
        <div class="pile" style="gap:.5rem">
          <span class="label" style="font-weight:600;font-size:.92rem">Photos</span>
          <div class="photos-edit" id="p-photos-liste">${lignesPhotos()}</div>
          <small class="aide">La première photo (encadrée) est la photo principale : montrez de préférence un produit déjà personnalisé. Format carré conseillé ; les photos sont réduites automatiquement.</small>
        </div>
        <div class="grille-champs">
          <div class="champ large"><label for="p-nom">Nom du produit *</label><input type="text" id="p-nom" required value="${echapper(p.nom)}"></div>
          <div class="champ"><label for="p-cat">Catégorie</label><select id="p-cat">${D.categories.map((c) => `<option value="${echapper(c.id)}" ${c.id === p.categorie ? "selected" : ""}>${echapper(c.nom)}</option>`).join("")}</select></div>
          <div class="champ"><label for="p-dispo">Disponibilité</label><select id="p-dispo">${Object.entries(DISPOS).map(([k, v]) => `<option value="${k}" ${k === p.dispo ? "selected" : ""}>${v}</option>`).join("")}</select></div>
          <div class="champ"><label for="p-prix">Prix de base (€) *</label><input type="number" id="p-prix" step="0.01" min="0" required value="${Number(p.prix || 0)}"></div>
          <div class="champ"><label for="p-prix-barre">Ancien prix barré (€)</label><input type="number" id="p-prix-barre" step="0.01" min="0" value="${Number(p.prixBarre || 0) || ""}" placeholder="Pour une promotion"><small>Laisser vide sans promotion.</small></div>
          <div class="champ"><label for="p-badge">Badge sur la photo</label><select id="p-badge">${Object.entries(BADGES).map(([k, v]) => `<option value="${k}" ${k === (p.badge || "") ? "selected" : ""}>${v}</option>`).join("")}</select></div>
          <div class="champ"><label for="p-delai">Délai de fabrication (jours)</label><input type="number" id="p-delai" min="0" step="1" value="${Number(p.delai || 0) || ""}" placeholder="Ex. : 7"><small>Affiche une date indicative sur la fiche.</small></div>
          <div class="champ large"><label for="p-desc">Description</label><textarea id="p-desc" rows="4">${echapper(p.description)}</textarea></div>
          <div class="champ large"><label for="p-instructions">Consigne de personnalisation pour le client</label><input type="text" id="p-instructions" value="${echapper(p.instructions)}" placeholder="Ex. : Indiquez le prénom, la date de naissance, l'heure, le poids et la taille."></div>
        </div>
        <div class="interrupteurs">
          <label class="case"><input type="checkbox" id="p-visible" ${p.visible !== false ? "checked" : ""}> Visible sur le site</label>
          <label class="case"><input type="checkbox" id="p-vedette" ${p.vedette ? "checked" : ""}> Coup de cœur (page d'accueil)</label>
          <label class="case"><input type="checkbox" id="p-texte" ${p.options.texte ? "checked" : ""}> Le client peut saisir un texte</label>
          <label class="case"><input type="checkbox" id="p-opt-photo" ${p.options.photo ? "checked" : ""}> Le client peut envoyer une photo</label>
        </div>
        ${D.occasions.length ? `
        <div class="pile" style="gap:.5rem">
          <span class="label" style="font-weight:600;font-size:.92rem">Occasions <small class="aide">(page « Idées cadeaux » et filtres)</small></span>
          <div class="cases-occasions">${D.occasions.map((o) => `<label class="case"><input type="checkbox" data-occasion="${echapper(o.id)}" ${p.occasions.includes(o.id) ? "checked" : ""}> ${echapper(o.nom)}</label>`).join("")}</div>
        </div>` : ""}
        <div class="pile" style="gap:.6rem">
          <div class="champ"><label for="p-var-nom">Choix proposés au client <small class="aide">(facultatif : taille, couleur, finition…)</small></label>
            <input type="text" id="p-var-nom" value="${echapper(p.variantes.nom)}" placeholder="Intitulé, ex. : Taille"></div>
          <div class="pile" id="p-variantes" style="gap:.5rem">${lignesVariantes()}</div>
          <button type="button" class="mini" id="p-var-ajout" style="justify-self:start">+ Ajouter un choix</button>
          <small class="aide">Le supplément s'ajoute au prix de base (0 si même prix).</small>
        </div>
        <details>
          <summary>Avancé</summary>
          <div class="champ" style="margin-top:.8rem"><label for="p-id">Identifiant (adresse de la page)</label><input type="text" id="p-id" value="${echapper(p.id)}" placeholder="créé automatiquement à partir du nom"><small>Évitez de le changer : les liens déjà partagés ne marcheraient plus.</small></div>
        </details>
        <div class="fenetre-pied">
          <button type="button" class="btn btn-ligne" id="p-annuler">Annuler</button>
          <button type="submit" class="btn">Valider</button>
        </div>
      </form>`;

    const lireVariantes = () => {
      f.querySelectorAll("[data-v]").forEach((el) => {
        const c = p.variantes.choix[el.dataset.k];
        c[el.dataset.v] = el.dataset.v === "prix" ? Number(el.value || 0) : el.value;
      });
    };
    const majPhotos = () => ($("#p-photos-liste", f).innerHTML = lignesPhotos());
    $("#p-var-ajout", f).onclick = () => {
      lireVariantes();
      p.variantes.choix.push({ nom: "", prix: 0 });
      $("#p-variantes", f).innerHTML = lignesVariantes();
    };
    $("#p-variantes", f).onclick = (e) => {
      const k = e.target.dataset.vSuppr;
      if (k === undefined) return;
      lireVariantes();
      p.variantes.choix.splice(Number(k), 1);
      $("#p-variantes", f).innerHTML = lignesVariantes();
    };
    $("#p-photos-liste", f).onclick = (e) => {
      const b = e.target.closest("[data-ph]");
      if (!b) return;
      const k = Number(b.dataset.k);
      if (b.dataset.ph === "gauche") [p.images[k - 1], p.images[k]] = [p.images[k], p.images[k - 1]];
      if (b.dataset.ph === "droite") [p.images[k + 1], p.images[k]] = [p.images[k], p.images[k + 1]];
      if (b.dataset.ph === "suppr") p.images.splice(k, 1);
      majPhotos();
    };
    $("#p-photos-liste", f).onchange = async (e) => {
      if (e.target.id !== "p-photos") return;
      for (const fichier of e.target.files) {
        try {
          p.images.push(await envoyerPhoto(fichier, $("#p-nom", f).value || "produit"));
          majPhotos();
        } catch (err) {
          toast(`Échec de l'envoi de la photo (${err.detail || err.message}).`, true);
        }
      }
    };
    $("#p-annuler", f).onclick = () => f.close();
    $("#form-produit", f).onsubmit = (e) => {
      e.preventDefault();
      lireVariantes();
      p.nom = $("#p-nom", f).value.trim();
      p.categorie = $("#p-cat", f).value;
      p.dispo = $("#p-dispo", f).value;
      p.prix = Number($("#p-prix", f).value || 0);
      p.prixBarre = Number($("#p-prix-barre", f).value || 0);
      p.badge = $("#p-badge", f).value;
      p.delai = Math.max(0, parseInt($("#p-delai", f).value, 10) || 0);
      p.description = $("#p-desc", f).value.trim();
      p.instructions = $("#p-instructions", f).value.trim();
      p.visible = $("#p-visible", f).checked;
      p.vedette = $("#p-vedette", f).checked;
      p.options = { texte: $("#p-texte", f).checked, photo: $("#p-opt-photo", f).checked };
      p.occasions = [...f.querySelectorAll("[data-occasion]:checked")].map((x) => x.dataset.occasion);
      p.image = p.images[0] || "";
      p.variantes.nom = $("#p-var-nom", f).value.trim();
      p.variantes.choix = p.variantes.choix.filter((c) => c.nom.trim());
      if (!p.variantes.choix.length) delete p.variantes;
      p.id = idUnique($("#p-id", f).value.trim() || p.nom, D.produits, index);
      if (nouveau) D.produits.unshift(p);
      else D.produits[index] = p;
      f.close();
      marquerModifie();
      if (onglet !== "produits") allerA("produits");
      else rendre();
      toast("Produit enregistré. Pensez à cliquer sur « Publier les modifications ».");
    };
    f.showModal();
  }

  // ---------- Vue : Catégories et occasions ----------
  function vueCategories() {
    return `
      <section class="bloc">
        <div class="bloc-tete">
          <h2>Catégories</h2>
          <button class="btn" data-action="nouvelle-categorie">+ Ajouter une catégorie</button>
        </div>
        <div class="liste">
          ${D.categories
            .map((c, i) => {
              const n = D.produits.filter((p) => p.categorie === c.id).length;
              return `
            <div class="ligne">
              ${vignette(c.image)}
              <div class="ligne-texte"><strong>${echapper(c.nom)}</strong><span>${n} produit${n > 1 ? "s" : ""} · ${echapper(c.description)}</span></div>
              <div class="ligne-boutons">
                <button class="mini" data-action="cat-monter" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Monter">↑</button>
                <button class="mini" data-action="cat-descendre" data-i="${i}" ${i === D.categories.length - 1 ? "disabled" : ""} aria-label="Descendre">↓</button>
                <button class="mini" data-action="modifier-categorie" data-i="${i}">Modifier</button>
                <button class="mini danger" data-action="supprimer-categorie" data-i="${i}">Supprimer</button>
              </div>
            </div>`;
            })
            .join("")}
        </div>
      </section>`;
  }
  function vueOccasions() {
    return `
      <section class="bloc">
        <div class="bloc-tete">
          <h2>Occasions</h2>
          <button class="btn btn-ligne" data-action="nouvelle-occasion">+ Ajouter une occasion</button>
        </div>
        <p class="aide">Elles alimentent la page « Idées cadeaux » et les filtres de la boutique. Cochez les occasions de chaque produit dans sa fiche.</p>
        <div class="liste">
          ${D.occasions
            .map((o, i) => {
              const n = D.produits.filter((p) => (p.occasions || []).includes(o.id)).length;
              return `
            <div class="ligne" style="grid-template-columns:1fr auto auto">
              <input type="text" value="${echapper(o.nom)}" data-liste="occasions" data-i="${i}" data-champ="nom" aria-label="Nom de l'occasion">
              <span class="aide">${n} produit${n > 1 ? "s" : ""}</span>
              <div class="ligne-boutons">
                <button class="mini" data-action="occ-monter" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Monter">↑</button>
                <button class="mini danger" data-action="supprimer-occasion" data-i="${i}">Supprimer</button>
              </div>
            </div>`;
            })
            .join("")}
        </div>
      </section>`;
  }
  function editerCategorie(index) {
    const nouveau = index < 0;
    const c = nouveau ? { id: "", nom: "", description: "", image: "" } : structuredClone(D.categories[index]);
    const f = $("#fenetre");
    f.innerHTML = `
      <form method="dialog" id="form-cat">
        <h2 style="font-size:1.35rem">${nouveau ? "Nouvelle catégorie" : "Modifier la catégorie"}</h2>
        <div class="image-champ">
          <span class="ligne-image" id="c-vignette">${c.image ? `<img src="${echapper(srcImage(c.image))}" alt="">` : "Sans photo"}</span>
          <div class="pile" style="gap:.5rem">
            <span class="btn btn-ligne bouton-fichier">Choisir une photo<input type="file" accept="image/*" id="c-photo" aria-label="Choisir une photo"></span>
            <small class="aide">Affichée sur la tuile de la page d'accueil.</small>
          </div>
        </div>
        <div class="champ"><label for="c-nom">Nom *</label><input type="text" id="c-nom" required value="${echapper(c.nom)}"></div>
        <div class="champ"><label for="c-desc">Description courte</label><textarea id="c-desc" rows="2">${echapper(c.description)}</textarea></div>
        <div class="fenetre-pied">
          <button type="button" class="btn btn-ligne" id="c-annuler">Annuler</button>
          <button type="submit" class="btn">Valider</button>
        </div>
      </form>`;
    $("#c-photo", f).onchange = async (e) => {
      const fichier = e.target.files[0];
      if (!fichier) return;
      try {
        c.image = await envoyerPhoto(fichier, "categorie-" + ($("#c-nom", f).value || "photo"));
        $("#c-vignette", f).innerHTML = `<img src="${echapper(srcImage(c.image))}" alt="">`;
      } catch (err) {
        toast(`Échec de l'envoi de la photo (${err.detail || err.message}).`, true);
      }
    };
    $("#c-annuler", f).onclick = () => f.close();
    $("#form-cat", f).onsubmit = (e) => {
      e.preventDefault();
      c.nom = $("#c-nom", f).value.trim();
      c.description = $("#c-desc", f).value.trim();
      if (nouveau) {
        c.id = idUnique(c.nom, D.categories);
        D.categories.push(c);
      } else D.categories[index] = c;
      f.close();
      marquerModifie();
      rendre();
    };
    f.showModal();
  }

  // ---------- Vue : Avis clients ----------
  function vueAvis() {
    const pg = D.site.plateformesAvis;
    const produits = [["", "— Aucun produit précis —"], ...D.produits.map((p) => [p.id, p.nom])];
    return `
      <section class="bloc">
        <div class="bloc-tete"><h2>Vos pages d'avis</h2></div>
        <p class="aide">Ces liens et chiffres s'affichent sur le site (accueil, fiches produit, page « Avis ») avec des boutons « Laisser un avis ». Mettez les chiffres à jour de temps en temps.</p>
        <div class="grille-champs">
          ${champ("site.plateformesAvis.facebook.lien", "Page des avis Facebook", { type: "url", large: true })}
          ${champ("site.plateformesAvis.facebook.taux", "Facebook : % de recommandation", { type: "nombre" })}
          ${champ("site.plateformesAvis.facebook.nombre", "Facebook : nombre d'avis", { type: "nombre" })}
          ${champ("site.plateformesAvis.google.lien", "Fiche Google (lien vers vos avis)", { type: "url", large: true, placeholder: "https://maps.app.goo.gl/…", aide: "Sur Google Maps, ouvrez votre fiche → Partager → copier le lien." })}
          ${champ("site.plateformesAvis.google.lienAvis", "Lien « Laisser un avis » Google", { type: "url", large: true, placeholder: "https://g.page/r/…/review", aide: "Dans votre fiche d'établissement Google (Google Business Profile) → « Demander des avis » → copier le lien. C'est ce lien que le QR code ci-dessous utilisera." })}
          ${champ("site.plateformesAvis.google.note", "Google : note moyenne (sur 5)", { type: "nombre", placeholder: "4.9" })}
          ${champ("site.plateformesAvis.google.nombre", "Google : nombre d'avis", { type: "nombre" })}
        </div>
      </section>

      <section class="bloc">
        <div class="bloc-tete">
          <h2>Carte « Laissez-nous un avis » à imprimer</h2>
          <button class="btn" data-action="carte-qr" ${pg.google.lienAvis || pg.google.lien || pg.facebook.lien ? "" : "disabled"}>Créer la carte</button>
        </div>
        <p class="aide">Une carte avec un QR code à poser sur le comptoir ou à glisser dans les paquets : les clients scannent et arrivent directement sur votre page d'avis${pg.google.lienAvis || pg.google.lien ? " Google" : pg.facebook.lien ? " Facebook" : ""}. Format A6 (10,5 × 14,8 cm), à imprimer en couleur.</p>
        <div id="carte-qr"></div>
      </section>

      <section class="bloc">
        <div class="bloc-tete">
          <h2>Avis affichés <span class="aide">(${D.avis.length})</span></h2>
          <button class="btn" data-action="nouvel-avis">+ Ajouter un avis</button>
        </div>
        <p class="aide">Recopiez de vrais avis (Facebook, Google…). Les 3 premiers s'affichent sur l'accueil, tous sur la page « Avis ». Liez un avis à un produit pour l'afficher aussi sur sa fiche.</p>
        <div>
          ${D.avis
            .map(
              (a, i) => `
            <div class="ligne-edit">
              <div class="grille-avis">
                <div class="champ"><label>Prénom et initiale</label><input type="text" value="${echapper(a.nom)}" data-liste="avis" data-i="${i}" data-champ="nom" placeholder="Sophie L."></div>
                <div class="champ"><label>Source</label><select data-liste="avis" data-i="${i}" data-champ="source">${[["facebook", "Facebook"], ["google", "Google"], ["autre", "Autre"]].map(([k, v]) => `<option value="${k}" ${a.source === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
                <div class="champ"><label>Note${a.source === "facebook" ? " (non affichée)" : ""}</label><select data-liste="avis" data-i="${i}" data-champ="note" data-type="nombre">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}" ${Number(a.note || 5) === n ? "selected" : ""}>${"★".repeat(n)}</option>`).join("")}</select></div>
                <div class="champ"><label>Date</label><input type="text" value="${echapper(a.date)}" data-liste="avis" data-i="${i}" data-champ="date" placeholder="Septembre 2026"></div>
              </div>
              <div class="champ"><label>Texte de l'avis</label><textarea rows="2" data-liste="avis" data-i="${i}" data-champ="texte">${echapper(a.texte)}</textarea></div>
              <div class="ligne-edit-tete">
                <div class="champ" style="flex:1 1 260px"><label>Produit concerné (facultatif)</label><select data-liste="avis" data-i="${i}" data-champ="produit">${produits.map(([k, v]) => `<option value="${echapper(k)}" ${(a.produit || "") === k ? "selected" : ""}>${echapper(v)}</option>`).join("")}</select></div>
                <div class="ligne-boutons">
                  <button class="mini" data-action="avis-monter" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Monter">↑</button>
                  <button class="mini danger" data-action="supprimer-avis" data-i="${i}">Supprimer</button>
                </div>
              </div>
            </div>`
            )
            .join("") || `<p class="aide" style="padding:1rem 0">Aucun avis pour l'instant.</p>`}
        </div>
      </section>

      <section class="bloc">
        <div class="bloc-tete"><h2>Avis Google et Facebook automatiques (facultatif)</h2></div>
        <p class="aide">Pour que les nouveaux avis apparaissent tout seuls, créez un widget sur un service spécialisé (par exemple Trustindex ou Elfsight, qui ont des formules gratuites limitées : vérifiez leurs conditions), connectez-y votre fiche Google et votre page Facebook, puis collez ici le code qu'il vous donne. Il s'affichera en haut de la page « Avis ».</p>
        ${champ("widgetAvis", "Code du widget", { type: "zone", lignes: 4, placeholder: "<script src=…></script>" })}
      </section>`;
  }

  // Carte A6 avec QR code vers la page d'avis (dessinée sur un canvas, téléchargeable en PNG)
  async function creerCarteQR() {
    const pg = D.site.plateformesAvis;
    const google = pg.google.lienAvis || pg.google.lien;
    const lien = google || pg.facebook.lien;
    if (!lien || !window.qrcode) return toast("Ajoutez d'abord le lien de votre page d'avis.", true);
    const qr = qrcode(0, "M");
    qr.addData(lien);
    qr.make();
    const W = 1240, H = 1748; // A6 à 300 dpi
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#fbf6ef";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "#a8693a";
    g.lineWidth = 6;
    g.strokeRect(40, 40, W - 80, H - 80);
    const logo = await new Promise((ok) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ok(null);
      i.src = "img/logo.webp";
    });
    if (logo) g.drawImage(logo, (W - 460) / 2, 90, 460, (460 * logo.height) / logo.width);
    g.fillStyle = "#1b1a17";
    g.textAlign = "center";
    g.font = "600 92px 'Bricolage Grotesque', sans-serif";
    g.fillText("Votre avis compte !", W / 2, 640);
    g.font = "400 46px Figtree, sans-serif";
    g.fillStyle = "#5f5a52";
    g.fillText(`Scannez pour laisser un avis ${google ? "sur Google" : "sur Facebook"}`, W / 2, 720);
    const n = qr.getModuleCount();
    const taille = 640;
    const pas = Math.floor(taille / (n + 8));
    const x0 = (W - pas * (n + 8)) / 2;
    const y0 = 780;
    g.fillStyle = "#fff";
    g.fillRect(x0, y0, pas * (n + 8), pas * (n + 8));
    g.fillStyle = "#1b1a17";
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect(x0 + (k + 4) * pas, y0 + (r + 4) * pas, pas, pas);
    g.fillStyle = "#24453a";
    g.font = "600 48px Figtree, sans-serif";
    g.fillText("Merci pour votre confiance ♥", W / 2, y0 + pas * (n + 8) + 110);
    g.fillStyle = "#5f5a52";
    g.font = "400 38px Figtree, sans-serif";
    g.fillText(`${D.site.adresse} · ${D.site.telephone}`, W / 2, H - 110);
    const url = c.toDataURL("image/png");
    $("#carte-qr").innerHTML = `
      <div class="pile" style="gap:.8rem;justify-items:start">
        <img src="${url}" alt="Aperçu de la carte" style="width:min(280px,100%);border-radius:8px;box-shadow:var(--ombre)">
        <a class="btn" href="${url}" download="carte-avis-mon-truc-en-bois.png">Télécharger la carte (PNG)</a>
        <small class="aide">Le QR code mène à : ${echapper(lien)}</small>
      </div>`;
  }

  // ---------- Vue : FAQ ----------
  function vueFaq() {
    return `
      <section class="bloc">
        <div class="bloc-tete">
          <h2>Questions fréquentes <span class="aide">(${D.faq.length})</span></h2>
          <button class="btn" data-action="nouvelle-question">+ Ajouter une question</button>
        </div>
        <p class="aide">Affichées sur la page « Questions » du site. Une bonne FAQ évite beaucoup d'appels et de messages.</p>
        <div>
          ${D.faq
            .map(
              (x, i) => `
            <div class="ligne-edit">
              <div class="champ"><label>Question</label><input type="text" value="${echapper(x.q)}" data-liste="faq" data-i="${i}" data-champ="q"></div>
              <div class="champ"><label>Réponse</label><textarea rows="3" data-liste="faq" data-i="${i}" data-champ="r">${echapper(x.r)}</textarea></div>
              <div class="ligne-boutons" style="justify-content:flex-end">
                <button class="mini" data-action="faq-monter" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Monter">↑</button>
                <button class="mini danger" data-action="supprimer-question" data-i="${i}">Supprimer</button>
              </div>
            </div>`
            )
            .join("")}
        </div>
      </section>`;
  }

  // ---------- Vue : Infos boutique ----------
  function vueBoutique() {
    return `
      <section class="bloc">
        <div class="bloc-tete"><h2>Mise en ligne</h2></div>
        ${champ("site.apercu", "Mode « site en construction »", { type: "case", aide: "Affiche un bandeau et bloque l'envoi des commandes et des devis. Décochez quand les prix et l'email sont vérifiés." })}
      </section>
      <section class="bloc">
        <div class="bloc-tete"><h2>Coordonnées</h2></div>
        <div class="grille-champs">
          ${champ("site.nom", "Nom de la boutique")}
          ${champ("site.telephone", "Téléphone", { type: "tel" })}
          ${champ("site.email", "Email (reçoit les commandes et devis)", { type: "email" })}
          ${champ("site.whatsapp", "Numéro WhatsApp (facultatif)", { type: "tel", placeholder: "07 83 39 40 28", aide: "Ajoute « Commander par WhatsApp » au panier et un bouton de contact sur le site." })}
          ${champ("site.adresse", "Adresse", { large: true })}
          ${champ("site.facebook", "Lien de la page Facebook", { type: "url", large: true })}
          ${champ("site.instagram", "Lien du compte Instagram (facultatif)", { type: "url", large: true })}
          ${champ("site.slogan", "Slogan (pied de page)", { large: true })}
          ${champ("site.avis", "Mention des avis (accueil)", { aide: "Ex. : Recommandé à 100 % · 16 avis" })}
        </div>
      </section>
      <section class="bloc">
        <div class="bloc-tete"><h2>Horaires</h2></div>
        ${champ("site.horaires", "Une ligne par jour, au format « Jour : horaires »", { type: "lignes" })}
      </section>
      <section class="bloc">
        <div class="bloc-tete"><h2>Livraison, cadeau et commandes</h2></div>
        <div class="grille-champs">
          ${champ("site.livraison", "Frais de livraison (€)", { type: "nombre" })}
          ${champ("site.livraisonOfferteDes", "Livraison offerte à partir de (€)", { type: "nombre" })}
          ${champ("site.emballage.actif", "Proposer un emballage cadeau", { type: "case" })}
          ${champ("site.emballage.prix", "Prix de l'emballage cadeau (€)", { type: "nombre" })}
          ${champ("site.formulaireCommande", "Adresse Formspree (facultatif)", { type: "url", large: true, aide: "Créez un formulaire gratuit sur formspree.io et collez son adresse : les commandes arriveront directement par email. Vide = la messagerie du client s'ouvre." })}
        </div>
      </section>`;
  }

  // ---------- Vue : Textes et annonce ----------
  function vueTextes() {
    return `
      <section class="bloc">
        <div class="bloc-tete"><h2>Annonce en haut du site</h2></div>
        <p class="aide">Pour prévenir d'une fermeture, d'un salon, d'une date limite de commande pour Noël…</p>
        ${champ("annonce.actif", "Afficher l'annonce", { type: "case" })}
        ${champ("annonce.texte", "Texte de l'annonce", { aide: "Ex. : Commandes de Noël : passez commande avant le 10 décembre." })}
        ${champ("annonce.lien", "Lien au clic (facultatif)", { placeholder: "boutique.html?occasion=noel", aide: "Une page du site (ex. boutique.html?occasion=noel) ou une adresse complète." })}
      </section>
      <section class="bloc">
        <div class="bloc-tete"><h2>Page d'accueil</h2></div>
        ${champ("textes.heroTitre", "Grand titre", { type: "zone", lignes: 2 })}
        ${champ("textes.heroTexte", "Texte d'introduction", { type: "zone", lignes: 3 })}
      </section>
      <section class="bloc">
        <div class="bloc-tete"><h2>Page « Qui sommes-nous ? »</h2></div>
        ${champ("textes.equipe", "Prénoms affichés", { aide: "Ex. : Christophe et Laetitia — laissez vide pour ne rien afficher." })}
        ${champ("textes.aPropos", "Présentation (un paragraphe par ligne)", { type: "lignes", lignes: 8 })}
      </section>`;
  }

  // ---------- Vue : Galerie ----------
  function vueGalerie() {
    return `
      <section class="bloc">
        <div class="bloc-tete">
          <h2>Galerie « Réalisations » <span class="aide">(${D.galerie.length} photos)</span></h2>
          <span class="btn bouton-fichier">+ Ajouter des photos<input type="file" accept="image/*" multiple id="g-ajout" aria-label="Ajouter des photos"></span>
        </div>
        <p class="aide">Affichée sur la page « Qui sommes-nous ? ». Utilisez les flèches pour changer l'ordre.</p>
        <div class="galerie-admin">
          ${D.galerie
            .map(
              (src, i) => `
            <figure>
              <img src="${echapper(srcImage(src))}" alt="" loading="lazy">
              <div class="ligne-boutons">
                <button class="mini" data-action="g-gauche" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Avancer">←</button>
                <button class="mini" data-action="g-droite" data-i="${i}" ${i === D.galerie.length - 1 ? "disabled" : ""} aria-label="Reculer">→</button>
                <button class="mini danger" data-action="g-suppr" data-i="${i}">Retirer</button>
              </div>
            </figure>`
            )
            .join("")}
        </div>
      </section>`;
  }

  // ---------- Actions des boutons ----------
  const echanger = (t, a, b) => ([t[a], t[b]] = [t[b], t[a]]);
  function telechargerSauvegarde() {
    const blob = new Blob([JSON.stringify(D, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sauvegarde-site-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $("#contenu").addEventListener("click", (e) => {
    const vers = e.target.closest("[data-aller]");
    if (vers) return allerA(vers.dataset.aller);
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const i = Number(b.dataset.i);
    const a = b.dataset.action;
    if (a === "nouveau-produit") return editerProduit(-1);
    if (a === "modifier-produit") return editerProduit(i);
    if (a === "nouvelle-categorie") return editerCategorie(-1);
    if (a === "modifier-categorie") return editerCategorie(i);
    if (a === "telecharger") return telechargerSauvegarde();
    if (a === "carte-qr") return creerCarteQR();
    if (a === "ouvrir-commandes") {
      if (!confirm("Ouvrir les commandes ? Le bandeau « site en construction » disparaîtra et les clients pourront envoyer leurs commandes.")) return;
      D.site.apercu = false;
      toast("Commandes ouvertes : cliquez sur « Publier les modifications » pour l'appliquer au site.");
    }
    if (a === "dupliquer-produit") {
      const copie = structuredClone(D.produits[i]);
      copie.nom += " (copie)";
      copie.id = idUnique(copie.nom, D.produits);
      copie.visible = false;
      D.produits.splice(i + 1, 0, copie);
      toast("Copie créée (masquée). Modifiez-la puis rendez-la visible.");
    }
    if (a === "supprimer-produit") {
      if (!confirm(`Supprimer « ${D.produits[i].nom} » ?`)) return;
      D.produits.splice(i, 1);
    }
    if (a === "basculer-vedette") D.produits[i].vedette = !D.produits[i].vedette;
    if (a === "basculer-visible") D.produits[i].visible = D.produits[i].visible === false;
    if (a === "monter") echanger(D.produits, i, i - 1);
    if (a === "descendre") echanger(D.produits, i, i + 1);
    if (a === "cat-monter") echanger(D.categories, i, i - 1);
    if (a === "cat-descendre") echanger(D.categories, i, i + 1);
    if (a === "supprimer-categorie") {
      const c = D.categories[i];
      const n = D.produits.filter((p) => p.categorie === c.id).length;
      if (n) return toast(`Impossible : ${n} produit(s) sont dans « ${c.nom} ». Déplacez-les d'abord dans une autre catégorie.`, true);
      if (!confirm(`Supprimer la catégorie « ${c.nom} » ?`)) return;
      D.categories.splice(i, 1);
    }
    if (a === "nouvelle-occasion") D.occasions.push({ id: idUnique("occasion", D.occasions), nom: "Nouvelle occasion" });
    if (a === "occ-monter") echanger(D.occasions, i, i - 1);
    if (a === "supprimer-occasion") {
      const o = D.occasions[i];
      if (!confirm(`Supprimer l'occasion « ${o.nom} » ? Elle sera retirée des produits.`)) return;
      D.produits.forEach((p) => (p.occasions = (p.occasions || []).filter((x) => x !== o.id)));
      D.occasions.splice(i, 1);
    }
    if (a === "nouvel-avis") D.avis.unshift({ nom: "", note: 5, texte: "", date: "", source: "Facebook" });
    if (a === "avis-monter") echanger(D.avis, i, i - 1);
    if (a === "supprimer-avis") {
      if (!confirm("Supprimer cet avis ?")) return;
      D.avis.splice(i, 1);
    }
    if (a === "nouvelle-question") D.faq.push({ q: "", r: "" });
    if (a === "faq-monter") echanger(D.faq, i, i - 1);
    if (a === "supprimer-question") {
      if (!confirm("Supprimer cette question ?")) return;
      D.faq.splice(i, 1);
    }
    if (a === "g-gauche") echanger(D.galerie, i, i - 1);
    if (a === "g-droite") echanger(D.galerie, i, i + 1);
    if (a === "g-suppr") D.galerie.splice(i, 1);
    marquerModifie();
    rendre();
  });

  // ---------- Démarrage ----------
  if (cfg.cle) demarrer();
  else afficherConnexion();
})();
