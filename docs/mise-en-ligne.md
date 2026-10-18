# Mise en ligne et utilisation au quotidien

Guide de l'agence. Le commerçant, lui, n'utilise que l'admin avec son email et son mot de passe (partie 2).
Les choix de plateformes et leurs coûts sont justifiés dans le benchmark des plateformes (document partagé de l'agence).

| Service | Rôle | Coût fixe |
|---|---|---|
| **Cloudflare Pages** | Hébergement du site (usage commercial autorisé), DNS, adresse contact@, statistiques sans cookie | Gratuit |
| **Nom de domaine** (.fr, registrar français) | montrucenbois.fr | ~10 € par an |
| **Supabase** (région Paris) | Commandes, clients, devis, codes promo, photos des clients, fonctions serveur | Gratuit pendant la mise en place, **Pro (25 $/mois)** dès l'ouverture : pas de mise en pause, sauvegarde quotidienne |
| **Stripe** | Paiement par carte, Apple Pay, Google Pay | Aucun : 1,5 % + 0,25 € par carte européenne |
| **Brevo** | Emails automatiques et newsletter (société française) | Gratuit jusqu'à 300 emails par jour |
| **Better Stack** | Surveillance du site et du serveur, alertes à l'agence | Gratuit |

> GitHub Pages ne convient pas en production : ses conditions interdisent les sites e-commerce. Il sert seulement pendant la mise en place.

Les clés secrètes sont chiffrées dans le navigateur et rangées dans les « secrets » GitHub, puis dans ceux du serveur : elles ne sont **jamais** publiées sur le site.

---

## 1. Installation (agence, une seule fois)

Ouvrez `admin.html` → **Accès agence** (clé GitHub de l'agence), puis l'onglet **Installation**. L'assistant détaille chaque étape à l'écran :

1. **Autoriser l'admin** — permissions de la clé de l'agence : *Contents*, *Secrets*, *Variables* (Read and write) et *Actions* (Read-only).
2. **Créer le serveur Supabase** — projet au nom du client, région **Paris** ; copier l'adresse du projet, la clé publique *anon* et un jeton d'accès (*Account → Access Tokens*).
3. **Compte du commerçant** — son email et son mot de passe (son seul identifiant), et la **clé de publication** : une deuxième clé GitHub limitée à *Contents* sur ce dépôt, qui permet au serveur de publier les modifications du commerçant. Noter sa date d'expiration (l'onglet Installation l'affiche et prévient 30 jours avant).
4. **Stripe** — clé secrète `sk_test_…` pour commencer. Le webhook de confirmation des paiements est créé tout seul.
5. **Brevo** — compte créé avec l'email de la boutique, clé API `xkeysib-…`, identifiant et clé SMTP (`xsmtpsib-…`) pour l'email « mot de passe oublié » en français. Avec le nom de domaine : authentifier le domaine dans Brevo et indiquer l'expéditeur (ex. `Mon Truc en Bois <bonjour@montrucenbois.fr>`).
6. **Installer** — l'assistant range les clés, relie le site au serveur et lance l'installation (2 à 4 minutes), avec la progression en direct et des vérifications vertes à la fin.

L'installation se relance autant de fois que nécessaire (elle ne supprime rien) : c'est aussi par là que l'on change une clé (Stripe en mode réel, nouvelle clé de publication, nouveau mot de passe…).

### Informations légales (avant l'ouverture)

Dans **Infos boutique → Informations légales** : exploitant, forme juridique, SIRET, **régime de TVA**, médiateur de la consommation. Elles alimentent automatiquement les CGV, les mentions légales et les factures. Tant qu'elles manquent, le tableau de bord les signale (sans bloquer l'ouverture) et les pages légales affichent « [à compléter] ».

- **Franchise en base** : factures avec la mention « TVA non applicable, article 293 B du CGI » ; la caisse accepte les espèces.
- **Assujetti à la TVA** : factures avec HT, TVA et TTC ; les espèces doivent passer par une caisse certifiée, la caisse de l'admin ne propose donc que carte, chèque et virement.
- **Médiateur** : obligatoire pour vendre aux particuliers (adhésion de 30 à 150 €).
- **Factures électroniques** : depuis le 1er septembre 2026, le commerçant doit pouvoir recevoir les factures de ses fournisseurs sur une plateforme agréée ; l'émission et le e-reporting des ventes suivront en septembre 2027 (chantier agence).

### Passer sur Cloudflare Pages et le nom de domaine

1. Acheter le domaine au nom du client ; créer le compte Cloudflare du client (agence en administrateur) et y déplacer les DNS du domaine.
2. Déplacer le dépôt dans l'organisation GitHub de l'agence et le passer en **privé** (possible hors GitHub Pages).
3. Cloudflare → *Workers & Pages* → *Create* → *Pages* → connecter le dépôt, branche `site-vitrine-boutique`, commande de build `node outils/construire.mjs`, dossier de sortie `dist`. Ajouter le domaine personnalisé. Les en-têtes de sécurité (`_headers`) et `robots.txt` sont pris en compte automatiquement.
4. Créer la variable de dépôt GitHub `HEBERGEMENT` = `cloudflare` : le robot de génération des pages produits s'arrête (Cloudflare les génère à chaque mise en ligne).
5. Dans l'admin : **Infos boutique** → adresse publique du site = `https://montrucenbois.fr`, hébergement = Cloudflare Pages, puis **Publier**. Onglet **Installation** → *Adresse du site (avancé)* → même adresse, et relancer l'installation (adresses autorisées du serveur, liens des emails).
6. Cloudflare : activer *Email Routing* (contact@montrucenbois.fr vers la boîte du commerçant) et *Web Analytics*. Brevo : authentifier le domaine (enregistrements DNS dans Cloudflare).
7. Better Stack : surveiller `https://montrucenbois.fr` et `https://….supabase.co/functions/v1/suivi?sante=1` (200 si la base répond, 503 sinon).
8. Désactiver GitHub Pages (Settings → Pages) une fois le domaine en ligne ; déclarer le site et `sitemap.xml` dans Google Search Console.

### Tester avant d'ouvrir

1. Dans **Infos boutique**, cocher les modes de paiement voulus ; dans le tableau de bord, vérifier l'email de la boutique, les prix et les informations légales.
2. Commande de test avec la carte Stripe `4242 4242 4242 4242` (mode test), puis une vraie commande de 1 € remboursée en mode réel.
3. Vérifier : la commande apparaît dans **Commandes**, le client dans **Clients**, les emails arrivent, le lien de suivi fonctionne, la facture est correcte.

### Ouvrir la boutique

1. Tableau de bord → **Ouvrir les commandes**, puis **Publier**.
2. Passer Supabase en **Pro** ; coller la clé Stripe `sk_live_…` dans l'onglet Installation et relancer.
3. Prise en main d'une heure avec le commerçant, sur son téléphone.

---

## 2. Au quotidien

### Commandes en ligne
Onglet **Commandes** : chaque commande arrive avec les textes à graver, les photos du client et la date souhaitée.
Changez le statut (*Maquette validée → En fabrication → Prête / Expédiée*) : le client est prévenu par email et suit l'avancement sur sa page de suivi.
Pour une commande « payer après validation », cliquez sur **Envoyer un lien de paiement** une fois la maquette validée.
Bon de commande, facture (numérotée automatiquement au paiement) et export tableur sont à portée de clic.

### Caisse : ventes en boutique, par téléphone, sur un salon
Onglet **Caisse** : touchez les produits (ou ajoutez un article sur mesure), choisissez ou créez le client, le moyen de paiement (carte, espèces, chèque…) et une remise éventuelle, puis **Enregistrer la vente** : facture imprimable immédiatement.
Une vente « à régler plus tard » apparaît dans les commandes à payer, avec possibilité d'envoyer un lien de paiement par carte.
Toutes les ventes (site, boutique, téléphone, salons) alimentent le même chiffre d'affaires et le même fichier clients.

### Clients
Onglet **Clients** : chaque commande, devis ou inscription crée ou complète une fiche. Historique d'achats, total dépensé, notes (préférences, dates importantes), étiquettes (`pro`, `mariage 2026`, `club de foot`…) pour retrouver un groupe.
Listes toutes prêtes : abonnés, clients fidèles, clients sans achat depuis 6 mois, prospects. Depuis une fiche : email, appel, WhatsApp, nouvelle vente.

### Demandes de devis
Onglet **Demandes** : les devis et messages envoyés depuis le site (vous recevez aussi un email). **Répondre par email** les classe en « Répondue » ; **Transformer en commande** ouvre la caisse avec le client déjà rempli.

### Marketing
Onglet **Marketing** :
- **Codes promo** (pourcentage ou montant, minimum d'achat, dates, nombre d'utilisations) : le client le saisit dans son panier, la remise est appliquée jusqu'au paiement par carte. Le bouton *Texte à partager* prépare un message pour Facebook, Instagram ou WhatsApp.
- **Email aux abonnés** : nouveautés, idées cadeaux avant une fête, code promo… envoyé seulement aux clients qui l'ont accepté, avec un lien de désinscription. Envoyez-vous d'abord un essai.
- Carte QR « Laissez-nous un avis » (onglet Avis clients) à poser sur le comptoir.

### Statistiques
Le tableau de bord affiche le chiffre d'affaires du mois (et son évolution), le panier moyen, les 12 derniers mois et la répartition site / boutique / téléphone / salons.
Pour les visites du site : Cloudflare Web Analytics (tableau de bord Cloudflare), ou GoatCounter dont le code se règle dans **Infos boutique → Référencement et statistiques**.

### Google
Chaque produit a sa propre page optimisée (titre, description, photo, prix), recréée automatiquement à chaque publication, et le plan du site `sitemap.xml` est tenu à jour.
À faire une fois : déclarer le site dans [Google Search Console](https://search.google.com/search-console) avec le plan du site, et mettre le lien du site sur la fiche Google de la boutique et la page Facebook.

---

## En cas de souci

| Constat | Que faire |
|---|---|
| L'onglet Installation indique « projet introuvable ou en pause » | Un projet Supabase gratuit se met en pause après 7 jours sans aucune visite : ouvrez supabase.com et cliquez sur *Restore*. La formule Pro supprime ce risque ; en gratuit, le site interroge le serveur deux fois par semaine (GitHub Actions) et la surveillance Better Stack le maintient actif. |
| L'installation échoue | Cliquez sur *Voir le journal détaillé* : le message en rouge donne la cause (jeton Supabase expiré, clé Stripe erronée…). Corrigez le champ concerné et relancez. |
| Les clients ne reçoivent pas d'email | Vérifier dans Installation que les emails sont configurés, et dans Brevo que l'expéditeur ou le domaine est validé. |
| Le commerçant ne peut plus publier | La clé de publication a expiré : en créer une nouvelle (Contents seulement) et la coller à l'étape 3 de l'onglet Installation. |
| Un paiement n'apparaît pas comme payé | Vérifiez dans Installation que la « confirmation automatique » est active ; sinon relancez l'installation. En dernier recours, « Marquer comme payée » dans la commande. |
| Mot de passe oublié | Écran de connexion → *Mot de passe oublié* (email de réinitialisation), ou nouveau mot de passe dans l'onglet Installation puis relance. |

---

## Pour les développeurs

- Base de données : `supabase/migrations/*.sql` (rejouables) — tables `commandes`, `clients`, `demandes`, `codes_promo`, `campagnes`, vue `stats_ventes`, accès réservés aux comptes de la table `admins` (RLS).
- Fonctions serveur (Deno) : `supabase/functions/` — `commande` (prix recalculés depuis le catalogue publié, codes promo, paiement Stripe), `suivi`, `contact` (devis, newsletter), `admin` (vente en boutique, emails, liens de paiement, campagnes, publication du contenu pour le commerçant), `stripe-webhook`. Emails : Brevo (`BREVO_API_KEY`) ou Resend (`RESEND_API_KEY`). Tests : `deno test --allow-env --allow-read supabase/tests/`.
- Installation : `.github/workflows/supabase.yml`, déclenché par l'admin via `supabase/installation.json` (message de commit contenant `[installation]`).
- Pages produits, plan du site, robots.txt : `node outils/generer-pages.mjs` ; `node outils/construire.mjs` prépare `dist/` pour Cloudflare Pages. Sur GitHub Pages, `.github/workflows/pages-produits.yml` les régénère à chaque modification de `data/donnees.js`.
