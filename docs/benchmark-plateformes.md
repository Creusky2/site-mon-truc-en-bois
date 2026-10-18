# Benchmark des plateformes — Mon Truc en Bois

Oct 18, 2026 · @Creusky

On garde la solution sur mesure, mais on la sort de GitHub Pages, dont les conditions interdisent l'e-commerce : Cloudflare Pages pour le site, Supabase Pro pour les données, Stripe pour le paiement, Brevo pour les emails. Coût fixe : environ 25 € par mois, contre 45 à 90 € pour Shopify avec une application de personnalisation, pour un outil plus adapté à la gravure sur mesure.

## Verdict par brique

Deux briques changent par obligation (hébergement, sauvegardes), deux par confort du commerçant (emails, connexion unique) ; tout le reste est déjà le bon choix. Les coûts sont des abonnements fixes, hors frais par paiement.

| Brique | Aujourd'hui | Recommandé | Coût fixe | Pourquoi |
| --- | --- | --- | --- | --- |
| Hébergement du site | GitHub Pages | **Cloudflare Pages** | 0 € | Les conditions de GitHub Pages interdisent l'e-commerce et la saisie de données de paiement. Cloudflare : 500 mises en ligne par mois, bande passante non facturée, dépôt de code privé possible. |
| Nom de domaine | Adresse github.io | **montrucenbois.fr** chez un registrar français (OVH), DNS chez Cloudflare | \~1 €/mois | Confiance, référencement, emails qui n'arrivent pas en indésirables. |
| Adresse email de la boutique | Adresse provisoire | **Cloudflare Email Routing** vers la boîte actuelle du commerçant | 0 € | contact@montrucenbois.fr sans nouvelle messagerie à apprendre. Une vraie boîte pro seulement s'il le demande. |
| Serveur et base de données | Supabase gratuit | **Supabase Pro**, région Paris, dès l'ouverture des commandes | 25 $/mois (\~23 €) | Le gratuit se met en pause après 1 semaine sans activité et n'a aucune sauvegarde. Pro : jamais en pause, sauvegarde quotidienne gardée 7 jours. |
| Paiement en ligne | Stripe | **Stripe** (inchangé) | 0 € | Standard du marché, carte, Apple Pay, Google Pay, liens de paiement. 1,5 % + 0,25 € par carte européenne standard. |
| Paiement en boutique | À confirmer | **Le TPE déjà en place**, sinon SumUp Air | 0 € | Sans abonnement : \~1,75 % par paiement, terminal \~39 € HT. La caisse de l'admin enregistre la vente et la facture. |
| Emails automatiques et newsletter | Resend | **Brevo** (offre gratuite) | 0 € | Société française, 300 emails par jour (100 chez Resend) pour commandes et newsletter ensemble, transactionnel inclus. Starter à 7 €/mois si la liste grossit. |
| Statistiques de visite | GoatCounter (option) | **Cloudflare Web Analytics** | 0 € | Inclus avec l'hébergement, sans cookie donc sans bandeau, rien à régler. |
| Surveillance | Aucune | **Better Stack** gratuit (ou l'outil de l'agence) | 0 € | L'agence est alertée avant le client. Le gratuit d'UptimeRobot est réservé au non commercial depuis fin 2024. |
| Accès du commerçant à l'admin | Clé GitHub + compte serveur | **Un seul identifiant** (email + mot de passe) | 0 € | La clé GitHub reste chez l'agence ; le commerçant ne voit jamais GitHub. |

Total fixe : environ 24 € par mois, dont 23 € pour Supabase Pro. Avant l'ouverture des commandes, la formule gratuite de Supabase suffit (environ 1 € par mois au total).

## Sur mesure ou plateforme tout-en-un

La solution actuelle coûte 2 à 3 fois moins cher par an que Shopify et fait mieux sur le cœur du métier (aperçu de gravure, photos en haute qualité, devis). Shopify reste le bon choix si l'agence ne veut assurer aucune maintenance de code.

| Option | Coût fixe par an | Frais par paiement carte | Personnalisation (texte, police, photo) | Caisse, clients, devis | Travail pour l'agence | Dépendance |
| --- | --- | --- | --- | --- | --- | --- |
| **Sur mesure actuel (recommandé)** | \~290 € (Supabase Pro + domaine) | 1,5 % + 0,25 € (Stripe) | Native : aperçu en direct, choix de police, photo en haute qualité, consignes par produit | Inclus : caisse, fichier clients, devis, codes promo, newsletter, statistiques | Mises à jour et support, à couvrir par un contrat de maintenance | Aucune : code et données appartiennent au client |
| Shopify Basic | 324 à 432 € + application de personnalisation 120 à 600 $ | 1,5 % + 0,25 € (Shopify Payments), +2 % avec un autre prestataire | Par application payante (Zepto 9,99 à 49,99 $/mois), aperçu 2D | Caisse Shopify POS, fichier clients et emails intégrés | Faible : thème et réglages | Forte : plateforme, applications, frais |
| Wix Business | \~490 € (40,80 €/mois) | Selon le prestataire de paiement | Options de produit simples, sans aperçu de gravure | Fichier clients intégré | Faible | Forte |
| WooCommerce | 120 à 360 € d'hébergement + extensions | Selon le prestataire de paiement | Par extensions payantes | Par extensions | Élevé : mises à jour de sécurité WordPress chaque mois | Moyenne |

Shopify devient préférable si le catalogue perd son côté sur mesure, si les ventes dépassent ce qu'une petite équipe suit à la main, ou si l'agence ne facture pas de maintenance. WooCommerce est écarté : c'est la seule option qui demande un entretien de sécurité mensuel, à l'opposé du « rien à gérer » visé.

## Architecture cible

&#91;embedded content: architecture cible · 8 services, 1 identifiant pour le commerçant\]

Quand le commerçant publie son catalogue, le serveur l'enregistre dans le dépôt GitHub de l'agence et Cloudflare remet le site en ligne en une minute. Better Stack surveille le site et le serveur et alerte l'agence.

## Obligations légales

Deux obligations sont déjà en vigueur et probablement pas couvertes : le médiateur de la consommation et la réception des factures électroniques (depuis le 1er septembre 2026). Tout dépend ensuite du régime de TVA du client, à confirmer en premier.

| Obligation | Ce client est-il concerné ? | Depuis / à partir de | Action |
| --- | --- | --- | --- |
| Médiateur de la consommation | Oui : tout vendeur aux particuliers, micro-entreprise comprise. Amende jusqu'à 3 000 € (personne physique) ou 15 000 € (société). | Déjà en vigueur | Adhérer à un médiateur référencé par la CECMC (30 à 150 €, souvent pour 3 ans) et l'indiquer dans les CGV et sur le site. |
| Factures électroniques : réception | Oui : toute entreprise établie en France, franchise de TVA comprise. Concerne les factures de ses fournisseurs. | 1er septembre 2026 | Ouvrir un compte sur une plateforme agréée (souvent proposée par la banque ou le logiciel de comptabilité). |
| Factures électroniques : émission et e-reporting des ventes aux particuliers | Oui | 1er septembre 2027 (micro-entreprises et PME) | Relier les factures du site et de la caisse à la plateforme choisie (export ou API) avant l'été 2027 : chantier agence. |
| Logiciel de caisse sécurisé (article 286 du CGI) | Non en franchise en base de TVA (micro-entreprise). Non plus si aucun paiement en espèces n'est enregistré. Sinon oui : une attestation de l'éditeur suffit depuis la loi de finances 2026. | Déjà en vigueur | Confirmer le régime de TVA. S'il est assujetti : encaisser les espèces sur une caisse certifiée (SumUp, Hiboutik…) et n'enregistrer dans l'admin que la carte, le chèque et le virement. |
| RGPD | Oui : le client est responsable du fichier clients. | Déjà en vigueur | Accepter les contrats de sous-traitance (DPA) de Supabase, Stripe et Brevo depuis leurs comptes ; tenir un registre des traitements d'une page. Données hébergées dans l'UE (Supabase Paris, Brevo). |
| Conservation des factures | 10 ans | Déjà en vigueur | Les sauvegardes Supabase Pro ne gardent que 7 jours : export mensuel des commandes et factures (déjà dans l'admin) remis au comptable. |
| CGV et mentions légales | Oui | Avant l'ouverture | Compléter SIRET, forme juridique, médiateur ; garder l'exception au droit de rétractation pour les objets personnalisés. |

## Qui fait quoi

Le commerçant ne fait que vendre : catalogue, commandes, caisse et clients depuis l'admin, sur son téléphone. Tous les comptes sont ouverts au nom du client (il en reste propriétaire) et administrés par l'agence.

| Tâche | Commerçant | Agence | Fréquence |
| --- | --- | --- | --- |
| Produits, prix, photos, annonces | Oui, depuis l'admin | Sur demande | Quand il veut |
| Commandes, caisse, devis, réponses aux clients | Oui | — | Chaque jour |
| Codes promo et emails aux abonnés | Oui, ou confié à l'agence | En option | Avant chaque fête |
| Vérification d'identité Stripe (pièce d'identité, IBAN) | Oui, une fois | Accompagne | À l'ouverture |
| Abonnements (Supabase, domaine) payés par la carte du client | Oui | Suit les factures | Mensuel, annuel |
| Domaine, DNS, emails, certificats | — | Oui | Renouvellement annuel |
| Surveillance, alertes, incidents | — | Oui | En continu |
| Mises à jour du code et des services | — | Oui | Trimestriel |
| Évolutions légales (facture électronique 2027) | — | Oui | Avant septembre 2027 |
| Export mensuel des factures pour le comptable | Un clic | Peut l'automatiser | Mensuel |

Ce découpage justifie un contrat de maintenance : les services coûtent \~24 € par mois, le reste est du temps d'agence.

## Plan de bascule

Onze étapes, environ une demi-journée d'agence plus 1 heure avec le client ; le site reste en ligne pendant toute la bascule.

1. **Client** — confirmer le régime de TVA, le SIRET, l'email de la boutique, les vrais prix et le TPE déjà utilisé.
2. **Agence** — acheter montrucenbois.fr au nom du client.
3. **Agence** — créer le compte Cloudflare du client, y déplacer les DNS du domaine, activer Email Routing (contact@ vers la boîte du commerçant).
4. **Agence** — déplacer le dépôt dans l'organisation GitHub de l'agence et le passer en privé ; brancher Cloudflare Pages dessus, avec le domaine ; changer l'adresse du site dans l'admin ; couper GitHub Pages.
5. **Agence** — installer le serveur Supabase (région Paris) avec l'assistant de l'admin ; passer en Pro à l'ouverture des commandes.
6. **Client** puis **agence** — ouvrir le compte Stripe au nom du client et faire la vérification d'identité ; coller la clé de production dans l'assistant.
7. **Agence** — ouvrir le compte Brevo, authentifier le domaine (enregistrements DNS dans Cloudflare), coller la clé dans l'assistant.
8. **Agence** — brancher la surveillance (Better Stack) et Cloudflare Web Analytics ; déclarer le site et son plan dans Google Search Console.
9. **Client** (accompagné) — adhérer à un médiateur, ouvrir la plateforme de facture électronique ; l'agence complète CGV et mentions.
10. **Agence** — passer une vraie commande de 1 € par carte, la rembourser, vérifier emails, facture, suivi.
11. **Agence + client** — 1 heure de prise en main de l'admin sur son téléphone, puis ouverture des commandes.

Côté code, les quatre adaptations sont faites et testées : envoi par Brevo, connexion unique du commerçant (le serveur publie avec une clé GitHub limitée au contenu), construction pour Cloudflare Pages avec en-têtes de sécurité, informations légales et régime de TVA repris dans les CGV, les factures et la caisse.

## Questions ouvertes

- [ ] Régime de TVA du client : franchise en base (micro-entreprise) ou assujetti ? Il décide des règles de caisse et des mentions de facture.
- [ ] Le commerçant a-t-il déjà un TPE, et chez qui ?
- [ ] Maintenance : forfait mensuel de l'agence, et qui paie les abonnements (carte du client recommandée) ?
- [ ] Tarifs Shopify et frais SumUp relevés sur des sites tiers : à reconfirmer si l'option Shopify est rouverte.

## Sources

Pages officielles consultées le 18 octobre 2026 : [limites de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) · [limites de Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/) · [tarifs Supabase](https://supabase.com/pricing) · [tarifs Brevo](https://www.brevo.com/fr/pricing/) · [tarifs Resend](https://resend.com/pricing) · [GoatCounter](https://www.goatcounter.com/) · [Supabase et RGPD](https://supabase.com/docs/guides/security/gdpr-compliance).

Autres sources (articles spécialisés, 2025-2026) : [certification des logiciels de caisse, economie.gouv.fr](https://www.economie.gouv.fr/entreprises/certification-logiciel-caisse) · [loi de finances 2026 et attestation éditeur, LégiFiscal](https://www.legifiscal.fr/actualites-fiscales/4460-loi-finances-2026-retablissement-auto-certification-logiciels-caisse.html) · [calendrier de la facture électronique, Indy](https://www.indy.fr/guide/facturation/electronique/report/) · [médiation de la consommation, donneespersonnelles.fr](https://donneespersonnelles.fr/mediation-consommation) · [frais Stripe, Indy](https://www.indy.fr/guide/comptabilite-en-ligne/commerce/stripe-comptabilite/frais-stripe/) · [prix Shopify, La Fabrique du Net](https://www.lafabriquedunet.fr/logiciels/tendances/shopify-prix-quels-tarifs-pour-creer-un-site-shopify) · [applications de personnalisation Shopify, Ecomate](https://ecomate.co/pages/top-7-best-product-personalizer-apps-for-shopify-in-2026) · [prix Wix, La Fabrique du Net](https://www.lafabriquedunet.fr/blog/prix-site-wix/) · [SumUp, Connectbanque](https://www.connectbanque.com/fr/avis-sumup-terminal-de-paiement-tpe) · [UptimeRobot réservé au non commercial, Notifier](https://notifier.so/guides/uptimerobot-pricing-2026/) · [Vercel et Netlify en usage commercial, AgentDeals](https://agentdeals.dev/vercel-vs-netlify).
