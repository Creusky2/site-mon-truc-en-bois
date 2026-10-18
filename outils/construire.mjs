// Construit le site pour l'hébergement (Cloudflare Pages) :
//   1. génère les pages produits, le plan du site et robots.txt (outils/generer-pages.mjs) ;
//   2. copie uniquement les fichiers publics dans dist/ (ni le code serveur, ni les tests, ni la documentation).
// Réglages Cloudflare Pages : commande de build « node outils/construire.mjs », dossier de sortie « dist ».
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
await import("./generer-pages.mjs");

const DIST = join(RACINE, "dist");
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST);
const PUBLICS = ["css", "js", "img", "data", "p", "sitemap.xml", "robots.txt", "_headers", "admin.webmanifest"];
for (const f of readdirSync(RACINE)) if (f.endsWith(".html")) PUBLICS.push(f);
for (const f of PUBLICS) if (existsSync(join(RACINE, f))) cpSync(join(RACINE, f), join(DIST, f), { recursive: true });
console.log(`Site construit dans dist/ (${PUBLICS.length} éléments).`);
