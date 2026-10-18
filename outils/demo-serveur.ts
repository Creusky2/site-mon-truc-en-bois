// Point d'entrée du mode démo : les vraies fonctions serveur, compilées pour tourner dans le navigateur
// (js/demo-serveur.js). js/demo.js leur fournit une fausse base de données, un faux Stripe et une boîte mail simulée.
// À relancer après toute modification de supabase/functions :
//   deno bundle --platform browser --format esm outils/demo-serveur.ts -o js/demo-serveur.js
export { traiter as commande } from "../supabase/functions/commande/index.ts";
export { traiter as suivi } from "../supabase/functions/suivi/index.ts";
export { traiter as contact } from "../supabase/functions/contact/index.ts";
export { traiter as admin } from "../supabase/functions/admin/index.ts";
export { traiter as webhook } from "../supabase/functions/stripe-webhook/index.ts";
export { viderCacheCatalogue } from "../supabase/functions/_shared/outils.ts";
