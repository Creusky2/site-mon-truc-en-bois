// Génère une vraie page par produit (p/<id>.html) et le plan du site (sitemap.xml) à partir de data/donnees.js.
// Ces pages contiennent dès le départ le titre, la description, la photo, le prix et les données « Produit » :
// Google les référence mieux, et un lien partagé sur Facebook ou WhatsApp affiche la bonne photo.
// Lancé automatiquement par GitHub (.github/workflows/pages-produits.yml) à chaque publication depuis l'admin.
// À la main : node outils/generer-pages.mjs
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (f) => readFileSync(join(RACINE, f), "utf8");
const brut = lire("data/donnees.js");
const D = JSON.parse(brut.slice(brut.search(/^window\.DONNEES = /m) + "window.DONNEES = ".length).trim().replace(/;\s*$/, ""));
const S = D.site;
const SITE = (S.url || "https://creusky2.github.io/site-mon-truc-en-bois").replace(/\/+$/, "");
const PAGES = ["", "boutique.html", "idees-cadeaux.html", "atelier.html", "avis.html", "faq.html", "contact.html", "newsletter.html", "cgv.html", "mentions-legales.html"];

const attr = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const absolu = (chemin) => (/^https?:/.test(chemin) ? chemin : `${SITE}/${String(chemin).replace(/^\.?\//, "")}`);
const court = (t, n = 158) => {
  const s = String(t ?? "").replace(/\s+/g, " ").trim();
  return s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1)) + "…";
};
const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
const prix = (n) => Number(n || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const modele = lire("produit.html");
const categories = Object.fromEntries((D.categories ?? []).map((c) => [c.id, c]));
const produits = (D.produits ?? []).filter((p) => p.visible !== false && /^[a-z0-9-]+$/.test(p.id));

mkdirSync(join(RACINE, "p"), { recursive: true });
const attendus = new Set();
for (const p of produits) {
  const url = `${SITE}/p/${p.id}.html`;
  const images = (p.images?.length ? p.images : p.image ? [p.image] : []).map(absolu);
  const cat = categories[p.categorie];
  const titre = `${p.nom} — ${S.nom}, personnalisation à Auchel`;
  const description = court(`${p.description} ${prix(p.prix)}${p.variantes?.choix?.some((c) => c.prix) ? " (à partir de)" : ""}. Fabriqué à Auchel, retrait en boutique ou livraison.`);
  const dispo = p.dispo === "epuise" ? "OutOfStock" : p.dispo === "commande" ? "MadeToOrder" : "InStock";
  const tete = `
  <base href="../">
  <meta name="description" content="${attr(description)}">
  <link rel="canonical" href="${attr(url)}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="${attr(S.nom)}">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${attr(p.nom)} — ${attr(S.nom)}">
  <meta property="og:description" content="${attr(description)}">
  <meta property="og:url" content="${attr(url)}">
  ${images[0] ? `<meta property="og:image" content="${attr(images[0])}">` : ""}
  <meta property="product:price:amount" content="${Number(p.prix).toFixed(2)}">
  <meta property="product:price:currency" content="EUR">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${json({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nom,
    description: p.description,
    image: images,
    sku: p.id,
    category: cat?.nom,
    brand: { "@type": "Brand", name: S.nom },
    offers: { "@type": "Offer", url, price: Number(p.prix).toFixed(2), priceCurrency: "EUR", availability: `https://schema.org/${dispo}`, seller: { "@type": "Organization", name: S.nom } },
  })}</script>
  <script type="application/ld+json">${json({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Boutique", item: `${SITE}/boutique.html` },
      ...(cat ? [{ "@type": "ListItem", position: 3, name: cat.nom, item: `${SITE}/boutique.html?categorie=${cat.id}` }] : []),
      { "@type": "ListItem", position: cat ? 4 : 3, name: p.nom, item: url },
    ],
  })}</script>`;
  // Contenu lisible sans JavaScript (remplacé par la page complète dès son chargement)
  const contenu = `
    <article class="pre-rendu">
      <p><a href="boutique.html">Boutique</a>${cat ? ` › <a href="boutique.html?categorie=${attr(cat.id)}">${attr(cat.nom)}</a>` : ""}</p>
      <h1>${attr(p.nom)}</h1>
      ${images[0] ? `<img src="${attr(p.images?.[0] || p.image)}" alt="${attr(p.nom)}" width="600">` : ""}
      <p>${attr(p.description)}</p>
      <p><strong>${prix(p.prix)}</strong></p>
    </article>`;
  const page = modele
    .replace(/<title>[^<]*<\/title>/, `<title>${attr(titre)}</title>`)
    .replace(/(<meta name="viewport"[^>]*>)/, `$1${tete}`)
    .replace("<body>", `<body data-produit="${attr(p.id)}">`)
    .replace(/(<main[^>]*id="contenu"[^>]*>)(<\/main>)/, `$1${contenu}\n  $2`)
    .replace("<!doctype html>", "<!doctype html>\n<!-- Page générée automatiquement depuis data/donnees.js (outils/generer-pages.mjs) : ne pas modifier à la main. -->");
  if (!page.includes(`data-produit="${attr(p.id)}"`) || !page.includes("pre-rendu")) throw new Error("produit.html n'a plus le format attendu par le générateur.");
  const fichier = join(RACINE, "p", `${p.id}.html`);
  attendus.add(`${p.id}.html`);
  if (!existsSync(fichier) || readFileSync(fichier, "utf8") !== page) writeFileSync(fichier, page);
}
// Produits supprimés ou masqués : leur page disparaît
for (const f of readdirSync(join(RACINE, "p"))) if (f.endsWith(".html") && !attendus.has(f)) unlinkSync(join(RACINE, "p", f));

// Pages fixes : adresse de référence et aperçu lors d'un partage (titre, description, image)
const DEBUT = "<!-- seo:debut (généré) -->";
const FIN = "<!-- seo:fin -->";
for (const page of PAGES) {
  const fichier = join(RACINE, page || "index.html");
  const html = readFileSync(fichier, "utf8");
  const titre = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? S.nom;
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? attr(S.slogan);
  const bloc = `${DEBUT}
  <link rel="canonical" href="${attr(`${SITE}/${page}`)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${attr(S.nom)}">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${titre}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${attr(`${SITE}/${page}`)}">
  <meta property="og:image" content="${attr(absolu("img/partage.jpg"))}">
  <meta name="twitter:card" content="summary_large_image">
  ${FIN}`;
  const nouveau = html.includes(DEBUT)
    ? html.replace(new RegExp(`${DEBUT}[\\s\\S]*?${FIN}`), bloc)
    : html.replace(/(<title>[^<]*<\/title>)/, `$1\n  ${bloc}`);
  if (nouveau !== html) writeFileSync(fichier, nouveau);
}

const urls = [...PAGES.map((p) => `${SITE}/${p}`), ...produits.map((p) => `${SITE}/p/${p.id}.html`)];
writeFileSync(
  join(RACINE, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${attr(u)}</loc></url>`).join("\n")}\n</urlset>\n`
);
// robots.txt : pris en compte quand le site est à la racine d'un domaine (montrucenbois.fr), ignoré sinon.
// Règles sans « .html » : elles couvrent aussi les adresses courtes servies par Cloudflare Pages (/admin, /panier…).
writeFileSync(join(RACINE, "robots.txt"), `User-agent: *\nDisallow: /admin\nDisallow: /panier\nDisallow: /suivi\nDisallow: /favoris\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`${produits.length} pages produits, sitemap de ${urls.length} adresses (${SITE}).`);
