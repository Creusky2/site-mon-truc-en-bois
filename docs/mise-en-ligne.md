# Mise en ligne des commandes et du paiement

Ce guide active, étape par étape, la partie « vraie boutique » du site :

- les **commandes enregistrées** (avec les photos des clients) et gérées dans l'admin, onglet **Commandes** ;
- le **paiement par carte** (Stripe : carte bancaire, Apple Pay, Google Pay), à la commande ou après validation de la maquette ;
- le **suivi de commande** pour le client (page `suivi.html`, lien envoyé par email) ;
- les **emails automatiques** (nouvelle commande, confirmation, paiement reçu, changement de statut, lien de paiement) ;
- les **bons de commande et factures** imprimables, l'**export tableur**.

Tant que ces étapes ne sont pas faites, le site continue de fonctionner comme avant : les commandes arrivent par email
(ou Formspree) et WhatsApp.

Compter environ **1 h 30** la première fois. Aucun logiciel à installer : tout se fait dans le navigateur.

| Service | Rôle | Coût |
|---|---|---|
| [Supabase](https://supabase.com) | Enregistre les commandes et les photos, compte de connexion de la boutique | Gratuit pour démarrer (plan Free) |
| [Stripe](https://stripe.com/fr) | Paiement par carte | Pas d'abonnement, commission par paiement ([tarifs](https://stripe.com/fr/pricing)) |
| [Resend](https://resend.com) | Envoi des emails | Gratuit jusqu'à un certain volume ([tarifs](https://resend.com/pricing)) |
| Nom de domaine (OVH, Gandi…) | Adresse du site et des emails, ex. `montrucenbois.fr` | Environ 10 €/an — nécessaire pour envoyer des emails aux clients |

> Vérifiez les conditions et tarifs à jour sur le site de chaque service : ils évoluent.

---

## Étape 1 — Créer le projet Supabase

1. Créez un compte sur [supabase.com](https://supabase.com) (bouton *Start your project*).
2. **New project** : nom `mon-truc-en-bois`, choisissez un **mot de passe de base de données** (notez-le), région
   **Europe** (*West EU (Paris)* si disponible, sinon *Central EU (Frankfurt)*), plan **Free**.
3. Attendez que le projet soit prêt (1 à 2 minutes).

## Étape 2 — Créer les tables des commandes

1. Dans Supabase, menu **SQL Editor** → **New query**.
2. Ouvrez le fichier [`supabase/migrations/20261017000000_commandes.sql`](../supabase/migrations/20261017000000_commandes.sql)
   sur GitHub, bouton *Copy raw file*, collez-le dans l'éditeur, puis **Run**.
3. Le message *Success. No rows returned* confirme que tout est créé.

## Étape 3 — Créer le compte de la boutique (connexion aux commandes)

1. Menu **Authentication** → **Users** → **Add user** → *Create new user* : votre email et un mot de passe solide,
   cochez **Auto Confirm User**.
2. Cliquez sur l'utilisateur créé et copiez son **User UID**.
3. **SQL Editor** → nouvelle requête, en remplaçant l'UID :
   ```sql
   insert into public.admins (user_id) values ('COLLEZ-ICI-LE-USER-UID');
   ```
   puis **Run**. Recommencez pour chaque personne qui doit gérer les commandes (ex. Christophe et Laetitia).
4. **Authentication** → **Sign In / Providers** (ou *Settings*) : **désactivez** « Allow new users to sign up »,
   pour que personne d'autre ne puisse créer de compte.
5. **Authentication** → **URL Configuration** : *Site URL* = `https://creusky2.github.io/site-mon-truc-en-bois/admin.html`
   (utile pour l'email « mot de passe oublié »).

## Étape 4 — Installer les fonctions serveur (depuis GitHub, en un clic)

Les fonctions serveur sont dans `supabase/functions`. Une tâche GitHub les installe sur Supabase.

1. **Jeton Supabase** : sur [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens),
   *Generate new token*, nom « GitHub », copiez-le.
2. **Identifiant du projet** : dans Supabase, *Project Settings* → *General* → **Project ID** (une suite de lettres).
3. Sur GitHub, dépôt `site-mon-truc-en-bois` → **Settings** → **Secrets and variables** → **Actions** :
   - onglet **Secrets** → *New repository secret* :
     | Nom | Valeur |
     |---|---|
     | `SUPABASE_ACCESS_TOKEN` | le jeton de l'étape 4.1 |
     | `STRIPE_SECRET_KEY` | la clé secrète Stripe (étape 5) — à ajouter plus tard si besoin |
     | `STRIPE_WEBHOOK_SECRET` | le secret du webhook Stripe (étape 5) |
     | `RESEND_API_KEY` | la clé Resend (étape 6) |
   - onglet **Variables** → *New repository variable* :
     | Nom | Valeur |
     |---|---|
     | `SUPABASE_PROJECT_REF` | l'identifiant du projet (étape 4.2) |
     | `SITE_URL` | `https://creusky2.github.io/site-mon-truc-en-bois` (ou votre nom de domaine) |
     | `SITE_ORIGINES` | `https://creusky2.github.io` (ou `https://montrucenbois.fr`) |
     | `BOUTIQUE_EMAIL` | l'adresse qui reçoit les nouvelles commandes |
     | `EMAIL_EXPEDITEUR` | ex. `Mon Truc en Bois <commandes@montrucenbois.fr>` (étape 6) |
     | `SUPABASE_URL` | *Project Settings* → *API* → *Project URL* |
     | `SUPABASE_ANON_KEY` | *Project Settings* → *API* → clé **anon public** |
4. Onglet **Actions** du dépôt → **« Supabase : fonctions serveur »** → **Run workflow**. Au bout de 2 minutes, la
   coche verte confirme l'installation (les tests des fonctions sont lancés avant).
5. À chaque ajout ou changement de secret, relancez cette tâche.

> La tâche « Supabase : garder le projet actif » interroge la base deux fois par semaine : le plan gratuit met en pause
> les projets sans activité, ce qui bloquerait les commandes. Elle utilise `SUPABASE_URL` et `SUPABASE_ANON_KEY`.

## Étape 5 — Stripe (paiement par carte)

1. Créez un compte sur [stripe.com/fr](https://stripe.com/fr). Commencez en **mode test** (interrupteur en haut).
2. **Développeurs** → **Clés API** : copiez la **clé secrète** (`sk_test_…`) → secret GitHub `STRIPE_SECRET_KEY`.
3. **Développeurs** → **Webhooks** → *Ajouter une destination* :
   - URL : `https://VOTRE-PROJET.supabase.co/functions/v1/stripe-webhook`
   - Événements : `checkout.session.completed` et `checkout.session.async_payment_succeeded`
   - Copiez le **secret de signature** (`whsec_…`) → secret GitHub `STRIPE_WEBHOOK_SECRET`.
4. **Paramètres** → **Moyens de paiement** : vérifiez Carte, Apple Pay, Google Pay (PayPal peut aussi être activé).
5. Relancez la tâche GitHub de l'étape 4.4.
6. Pour encaisser réellement : **activez le compte** Stripe (infos de l'entreprise, SIRET, IBAN, pièce d'identité),
   passez en **mode production**, refaites les étapes 5.2 et 5.3 avec les clés de production (`sk_live_…`),
   puis relancez la tâche GitHub.

## Étape 6 — Resend (emails)

1. Créez un compte sur [resend.com](https://resend.com), **API Keys** → *Create API Key* → secret GitHub `RESEND_API_KEY`.
2. **Domains** → *Add domain* : votre nom de domaine. Resend affiche des lignes DNS à ajouter chez votre
   registraire (OVH, Gandi…). Une fois le domaine vérifié, mettez par exemple
   `Mon Truc en Bois <commandes@montrucenbois.fr>` dans la variable `EMAIL_EXPEDITEUR`.
3. Sans domaine vérifié, Resend n'envoie des emails qu'à l'adresse de votre compte Resend : pratique pour tester,
   mais les clients ne recevraient rien.
4. Relancez la tâche GitHub de l'étape 4.4.

## Étape 7 — Relier le site (page admin)

1. Ouvrez `admin.html` → **Infos boutique** → **Commandes en ligne et paiement** :
   - *Adresse du projet Supabase* : *Project Settings* → *API* → *Project URL* ;
   - *Clé publique Supabase* : la clé **anon public** (jamais la clé `service_role`) ;
   - cochez les modes de paiement proposés aux clients ;
   - SIRET et mention TVA pour les factures.
2. **Publier les modifications**.
3. Onglet **Commandes** : connectez-vous avec le compte de l'étape 3.

## Étape 8 — Tester

1. Stripe en mode test, décochez provisoirement « site en construction » (ou testez avec **Prévisualiser**).
2. Passez une commande avec la carte de test `4242 4242 4242 4242`, date future, code `123`.
3. Vérifiez : la commande apparaît dans l'admin (avec la photo), les emails arrivent, la page de suivi fonctionne,
   la facture s'imprime.
4. Testez aussi « payer après validation » : dans l'admin, ouvrez la commande → *Envoyer un lien de paiement*.

## Étape 9 — Ouvrir la boutique

- Passez Stripe en production (étape 5.6).
- Complétez les **CGV** et les **mentions légales** (SIRET, médiateur de la consommation, hébergeurs).
- Dans l'admin : tableau de bord → **Ouvrir les commandes**, puis **Publier**.

---

## Au quotidien

- **Nouvelle commande** : email reçu + pastille dans l'onglet *Commandes*.
- Ouvrez la commande : texte à graver, police, photo du client, date souhaitée, message.
- Faites avancer le statut (*Maquette validée → En fabrication → Prête / Expédiée → Terminée*) : le client est
  prévenu par email si la case est cochée, et voit l'avancement sur sa page de suivi.
- **Paiement après validation** : bouton *Envoyer un lien de paiement*. **Paiement en boutique** :
  *Marquer comme payée*. La facture (numérotée F-année-0001…) est créée au paiement.
- **Export tableur** pour la comptabilité.

## En cas de souci

| Problème | À vérifier |
|---|---|
| Le panier affiche « Commandes en ligne non configurées » | Étape 7, puis *Publier* |
| « Ce compte n'a pas accès » dans l'onglet Commandes | Étape 3.3 (ligne dans la table `admins`) |
| Paiement réussi mais commande « À payer » | Webhook Stripe (étape 5.3) et secret `STRIPE_WEBHOOK_SECRET`, puis relancer la tâche GitHub |
| Pas d'email | Clé Resend, domaine vérifié, variable `EMAIL_EXPEDITEUR` (étape 6) ; Supabase → *Edge Functions* → *Logs* |
| Erreur « Les commandes en ligne ne sont pas encore ouvertes » | Le mode « site en construction » est encore actif |

## Pour les développeurs

- Base : `supabase/migrations/` (tables, sécurité RLS, numérotation, stockage des photos).
- Fonctions (Deno) : `supabase/functions/` — `commande` (prix recalculés à partir du catalogue publié),
  `stripe-webhook` (signature vérifiée), `suivi`, `admin` (réservée aux comptes de la table `admins`).
- Tests : `deno test --allow-env --allow-read supabase/tests/` (Supabase, Stripe et Resend simulés).
