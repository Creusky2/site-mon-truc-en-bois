// Construit le site pour l'hébergement (Cloudflare Pages) :
//   1. génère les pages produits, le plan du site et robots.txt (outils/generer-pages.mjs) ;
//   2. copie uniquement les fichiers publics dans dist/ (ni le code serveur, ni les tests, ni la documentation).
// Réglages Cloudflare Pages : commande de build « node outils/construire.mjs », dossier de sortie « dist ».
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
await import("./generer-pages.mjs");

const DIST = join(RACINE, "dist");
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST);
const PUBLICS = ["css", "js", "img", "data", "p", "sitemap.xml", "robots.txt", "_headers", "admin.webmanifest"];
for (const f of readdirSync(RACINE)) if (f.endsWith(".html")) PUBLICS.push(f);
// Le mode démo (demo.html, js/demo*.js) sert à présenter le site depuis GitHub Pages : il n'est pas mis en production.
const DEMO = /^(demo(-paiement)?\.html|js[\\/]demo(-serveur)?\.js)$/;
for (const f of PUBLICS)
  if (existsSync(join(RACINE, f))) cpSync(join(RACINE, f), join(DIST, f), { recursive: true, filter: (src) => !DEMO.test(src.slice(RACINE.length + 1)) });
// … et son script est retiré des pages mises en ligne
for (const dossier of [DIST, join(DIST, "p")])
  for (const f of readdirSync(dossier).filter((x) => x.endsWith(".html"))) {
    const chemin = join(dossier, f);
    writeFileSync(chemin, readFileSync(chemin, "utf8").replace(/^[ \t]*<script src="js\/demo\.js"><\/script>\r?\n/m, ""));
  }
console.log(`Site construit dans dist/ (${PUBLICS.length} éléments).`);
