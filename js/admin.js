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
  let onglet = "produits";
  let filtre = { q: "", cat: "" };
  const apercusLocaux = {}; // chemin image → dataURL (photos envoyées mais pas encore en ligne)

  function marquerModifie() {
    modifie = true;
    majStatut();
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
    D.produits ||= [];
    D.categories ||= [];
    D.galerie ||= [];
    D.textes ||= {};
    D.annonce ||= { actif: false, texte: "" };
    $("#connexion").hidden = true;
    $("#app").hidden = false;
    modifie = false;
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
    if (modifie && !confirm("Des modifications ne sont pas publiées. Se déconnecter quand même ?")) return;
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

  // ---------- Publication ----------
  $("#publier").addEventListener("click", async () => {
    const b = $("#publier");
    b.disabled = true;
    majStatut("Publication…");
    try {
      const texte = ENTETE + PREFIXE + JSON.stringify(D, null, 2) + ";\n";
      const r = await envoyerFichier(FICHIER, versBase64(texte), "Mise à jour du contenu du site (admin)", sha);
      sha = r.content.sha;
      modifie = false;
      majStatut();
      toast("Publié ! Le site sera à jour d'ici quelques minutes (rechargez la page du site).");
    } catch (e) {
      majStatut();
      b.disabled = false;
      if (e.status === 409 || e.status === 422)
        toast("Le site a été modifié ailleurs entre-temps. Rechargez la page admin (vos modifications non publiées seront perdues).", true);
      else toast(`Échec de la publication (${e.detail || e.message}).`, true);
    }
  });

  // ---------- Onglets ----------
  document.querySelector(".onglets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-onglet]");
    if (!b) return;
    onglet = b.dataset.onglet;
    document.querySelectorAll(".onglets button").forEach((x) => x.setAttribute("aria-selected", x === b));
    rendre();
  });

  function rendre() {
    const c = $("#contenu");
    if (onglet === "produits") c.innerHTML = vueProduits();
    if (onglet === "categories") c.innerHTML = vueCategories();
    if (onglet === "boutique") c.innerHTML = vueBoutique();
    if (onglet === "textes") c.innerHTML = vueTextes();
    if (onglet === "galerie") c.innerHTML = vueGalerie();
  }

  // Champs simples liés aux données : data-chemin="site.telephone", data-type="nombre|lignes|case"
  const lire = (chemin) => chemin.split(".").reduce((o, k) => o?.[k], D);
  function ecrire(chemin, valeur) {
    const cles = chemin.split(".");
    const dernier = cles.pop();
    const cible = cles.reduce((o, k) => (o[k] ??= {}), D);
    cible[dernier] = valeur;
  }
  function champ(chemin, libelle, { type = "text", aide = "", large = false, lignes = 0 } = {}) {
    const v = lire(chemin);
    const id = "f-" + chemin.replace(/\./g, "-");
    let entree;
    if (type === "case")
      return `<label class="case ${large ? "large" : ""}"><input type="checkbox" id="${id}" data-chemin="${chemin}" data-type="case" ${v ? "checked" : ""}> <span>${libelle}${aide ? `<br><small class="aide">${aide}</small>` : ""}</span></label>`;
    if (type === "lignes")
      entree = `<textarea id="${id}" data-chemin="${chemin}" data-type="lignes" rows="${lignes || 7}">${echapper((v || []).join("\n"))}</textarea>`;
    else if (type === "zone") entree = `<textarea id="${id}" data-chemin="${chemin}" rows="${lignes || 3}">${echapper(v)}</textarea>`;
    else
      entree = `<input type="${type === "nombre" ? "number" : type}" ${type === "nombre" ? 'step="0.01" min="0" data-type="nombre"' : ""} id="${id}" data-chemin="${chemin}" value="${echapper(v)}">`;
    return `<div class="champ ${large ? "large" : ""}"><label for="${id}">${libelle}</label>${entree}${aide ? `<small>${aide}</small>` : ""}</div>`;
  }
  $("#contenu").addEventListener("input", (e) => {
    const el = e.target.closest("[data-chemin]");
    if (!el) return;
    const t = el.dataset.type;
    const v = t === "case" ? el.checked : t === "nombre" ? Number(el.value || 0) : t === "lignes" ? el.value.split("\n").map((x) => x.trim()).filter(Boolean) : el.value;
    ecrire(el.dataset.chemin, v);
    marquerModifie();
  });

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
            <div class="ligne ${p.visible === false ? "masque" : ""}">
              ${vignette(p.image)}
              <div class="ligne-texte">
                <strong>${echapper(p.nom)}<span class="pastilles">${p.vedette ? '<span class="pastille coeur">Coup de cœur</span>' : ""}${p.visible === false ? '<span class="pastille cache">Masqué</span>' : ""}</span></strong>
                <span>${echapper(cats[p.categorie] || "Sans catégorie")} · ${euros(p.prix)}</span>
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
  $("#contenu").addEventListener("input", (e) => {
    if (e.target.id === "filtre-q") {
      filtre.q = e.target.value;
      const pos = e.target.selectionStart;
      rendre();
      const champQ = $("#filtre-q");
      champQ.focus();
      champQ.setSelectionRange(pos, pos);
    }
  });
  $("#contenu").addEventListener("change", (e) => {
    if (e.target.id === "filtre-cat") {
      filtre.cat = e.target.value;
      rendre();
    }
  });

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
      ? { id: "", nom: "", categorie: D.categories[0]?.id || "", prix: 0, image: "", description: "", options: { texte: true, photo: false }, visible: true, vedette: false }
      : structuredClone(D.produits[index]);
    p.options ||= {};
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
    f.innerHTML = `
      <form method="dialog" id="form-produit">
        <h2 style="font-size:1.35rem">${nouveau ? "Nouveau produit" : "Modifier le produit"}</h2>
        <div class="image-champ">
          <span class="ligne-image" id="p-vignette">${p.image ? `<img src="${echapper(srcImage(p.image))}" alt="">` : "Sans photo"}</span>
          <div class="pile" style="gap:.5rem">
            <span class="btn btn-ligne bouton-fichier">Choisir une photo<input type="file" accept="image/*" id="p-photo" aria-label="Choisir une photo"></span>
            <small class="aide">La photo est réduite automatiquement et envoyée sur le site. Format carré conseillé.</small>
            ${p.image ? `<button type="button" class="mini danger" id="p-sans-photo" style="justify-self:start">Retirer la photo</button>` : ""}
          </div>
        </div>
        <div class="grille-champs">
          <div class="champ large"><label for="p-nom">Nom du produit *</label><input type="text" id="p-nom" required value="${echapper(p.nom)}"></div>
          <div class="champ"><label for="p-cat">Catégorie</label><select id="p-cat">${D.categories.map((c) => `<option value="${echapper(c.id)}" ${c.id === p.categorie ? "selected" : ""}>${echapper(c.nom)}</option>`).join("")}</select></div>
          <div class="champ"><label for="p-prix">Prix de base (€) *</label><input type="number" id="p-prix" step="0.01" min="0" required value="${Number(p.prix || 0)}"></div>
          <div class="champ large"><label for="p-desc">Description</label><textarea id="p-desc" rows="4">${echapper(p.description)}</textarea></div>
        </div>
        <div class="interrupteurs">
          <label class="case"><input type="checkbox" id="p-visible" ${p.visible !== false ? "checked" : ""}> Visible sur le site</label>
          <label class="case"><input type="checkbox" id="p-vedette" ${p.vedette ? "checked" : ""}> Coup de cœur (page d'accueil)</label>
          <label class="case"><input type="checkbox" id="p-texte" ${p.options.texte ? "checked" : ""}> Le client peut saisir un texte</label>
          <label class="case"><input type="checkbox" id="p-opt-photo" ${p.options.photo ? "checked" : ""}> Le client peut envoyer une photo</label>
        </div>
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
          <button type="button" class="btn btn-ligne" value="annuler" id="p-annuler">Annuler</button>
          <button type="submit" class="btn" value="ok">Valider</button>
        </div>
      </form>`;

    const lireVariantes = () => {
      f.querySelectorAll("[data-v]").forEach((el) => {
        const c = p.variantes.choix[el.dataset.k];
        c[el.dataset.v] = el.dataset.v === "prix" ? Number(el.value || 0) : el.value;
      });
    };
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
    $("#p-photo", f).onchange = async (e) => {
      const fichier = e.target.files[0];
      if (!fichier) return;
      try {
        p.image = await envoyerPhoto(fichier, $("#p-nom", f).value || "produit");
        $("#p-vignette", f).innerHTML = `<img src="${echapper(srcImage(p.image))}" alt="">`;
      } catch (err) {
        toast(`Échec de l'envoi de la photo (${err.detail || err.message}).`, true);
      }
    };
    const sansPhoto = $("#p-sans-photo", f);
    if (sansPhoto)
      sansPhoto.onclick = () => {
        p.image = "";
        $("#p-vignette", f).textContent = "Sans photo";
      };
    $("#p-annuler", f).onclick = () => f.close();
    $("#form-produit", f).onsubmit = (e) => {
      e.preventDefault();
      lireVariantes();
      p.nom = $("#p-nom", f).value.trim();
      p.categorie = $("#p-cat", f).value;
      p.prix = Number($("#p-prix", f).value || 0);
      p.description = $("#p-desc", f).value.trim();
      p.visible = $("#p-visible", f).checked;
      p.vedette = $("#p-vedette", f).checked;
      p.options = { texte: $("#p-texte", f).checked, photo: $("#p-opt-photo", f).checked };
      p.variantes.nom = $("#p-var-nom", f).value.trim();
      p.variantes.choix = p.variantes.choix.filter((c) => c.nom.trim());
      if (!p.variantes.choix.length) delete p.variantes;
      p.id = idUnique($("#p-id", f).value.trim() || p.nom, D.produits, index);
      if (nouveau) D.produits.unshift(p);
      else D.produits[index] = p;
      f.close();
      marquerModifie();
      rendre();
      toast("Produit enregistré. Pensez à cliquer sur « Publier les modifications ».");
    };
    f.showModal();
  }

  // ---------- Vue : Catégories ----------
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
          ${champ("site.adresse", "Adresse")}
          ${champ("site.facebook", "Lien de la page Facebook", { type: "url", large: true })}
          ${champ("site.slogan", "Slogan (pied de page)", { large: true })}
          ${champ("site.avis", "Mention des avis (accueil)", { aide: "Ex. : Recommandé à 100 % · 16 avis" })}
        </div>
      </section>
      <section class="bloc">
        <div class="bloc-tete"><h2>Horaires</h2></div>
        ${champ("site.horaires", "Une ligne par jour, au format « Jour : horaires »", { type: "lignes" })}
      </section>
      <section class="bloc">
        <div class="bloc-tete"><h2>Livraison et commandes</h2></div>
        <div class="grille-champs">
          ${champ("site.livraison", "Frais de livraison (€)", { type: "nombre" })}
          ${champ("site.livraisonOfferteDes", "Livraison offerte à partir de (€)", { type: "nombre" })}
          ${champ("site.formulaireCommande", "Adresse Formspree (facultatif)", { type: "url", large: true, aide: "Créez un formulaire gratuit sur formspree.io et collez son adresse : les commandes arriveront directement par email. Vide = la messagerie du client s'ouvre." })}
        </div>
      </section>`;
  }

  // ---------- Vue : Textes et annonce ----------
  function vueTextes() {
    return `
      <section class="bloc">
        <div class="bloc-tete"><h2>Annonce en haut du site</h2></div>
        <p class="aide">Pour prévenir d'une fermeture, d'un salon, d'une promotion…</p>
        ${champ("annonce.actif", "Afficher l'annonce", { type: "case" })}
        ${champ("annonce.texte", "Texte de l'annonce", { aide: "Ex. : La boutique sera fermée du 21 au 28 octobre." })}
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
  $("#contenu").addEventListener("change", async (e) => {
    if (e.target.id !== "g-ajout") return;
    for (const fichier of e.target.files) {
      try {
        D.galerie.push(await envoyerPhoto(fichier, "realisation"));
        marquerModifie();
      } catch (err) {
        toast(`Échec de l'envoi d'une photo (${err.detail || err.message}).`, true);
      }
    }
    rendre();
  });

  // ---------- Actions des boutons ----------
  const echanger = (t, a, b) => ([t[a], t[b]] = [t[b], t[a]]);
  $("#contenu").addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const i = Number(b.dataset.i);
    const a = b.dataset.action;
    if (a === "nouveau-produit") return editerProduit(-1);
    if (a === "modifier-produit") return editerProduit(i);
    if (a === "nouvelle-categorie") return editerCategorie(-1);
    if (a === "modifier-categorie") return editerCategorie(i);
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
