# Mise en ligne et utilisation au quotidien

Le site fonctionne déjà en **vitrine** : catalogue, idées cadeaux, avis, devis par email, commandes par email ou WhatsApp.
Pour en faire une vraie boutique en ligne avec fichier clients, il faut installer **le serveur de la boutique**.
Tout se fait depuis la page admin, onglet **Installation** : comptez 20 minutes, une seule fois.

| Service | Rôle | Prix |
|---|---|---|
| **Supabase** | Base de données : commandes, clients, demandes, codes promo, photos des clients | Gratuit (jusqu'à 500 Mo, largement suffisant) |
| **Stripe** | Paiement par carte, Apple Pay, Google Pay | Pas d'abonnement : 1,5 % + 0,25 € par paiement (cartes européennes) |
| **Resend** | Emails automatiques (confirmation, suivi, newsletter) | Gratuit jusqu'à 3 000 emails par mois (100 par jour) |
| **GoatCounter** | Statistiques de visite, sans cookie | Gratuit (facultatif) |

Les clés secrètes (Supabase, Stripe, Resend) sont chiffrées dans votre navigateur et rangées dans les « secrets » GitHub : elles ne sont **jamais** publiées sur le site.

---

## 1. Installation (une seule fois)

Ouvrez `admin.html`, connectez-vous, puis l'onglet **Installation**. L'assistant détaille chaque étape à l'écran :

1. **Autoriser l'admin** — sur github.com, ajoutez à votre clé d'accès les permissions *Secrets* et *Variables* (Read and write) et *Actions* (Read-only). La clé reste la même.
2. **Créer le serveur Supabase** — compte sur supabase.com (bouton *Continue with GitHub*), nouveau projet en région **Paris**, puis copiez dans l'assistant : l'adresse du projet, la clé publique *anon*, et un jeton d'accès (*Account → Access Tokens*).
3. **Votre compte administrateur** — l'email et le mot de passe qui serviront à vous connecter aux commandes et aux clients (depuis n'importe quel appareil).
4. **Stripe** (facultatif) — collez la clé secrète `sk_test_…` pour commencer en mode test. La confirmation automatique des paiements (webhook) est créée toute seule.
5. **Resend** (recommandé) — collez la clé `re_…`. Tant que votre nom de domaine n'est pas vérifié chez Resend, les emails ne partent que vers l'adresse de votre compte Resend : parfait pour tester.
6. **Installer** — l'assistant range les clés, relie le site au serveur et lance l'installation (2 à 4 minutes). La progression s'affiche en direct ; à la fin, connectez-vous avec votre compte administrateur : toutes les vérifications doivent être vertes.

L'installation peut être relancée autant de fois que nécessaire : elle ne supprime rien. C'est aussi par là que l'on **change une clé** (passage de Stripe en mode réel, nouvelle clé Resend, nouveau mot de passe administrateur) : on remplit seulement le champ concerné et on relance.

### Tester avant d'ouvrir

1. Dans **Infos boutique**, cochez les modes de paiement voulus ; dans le tableau de bord, vérifiez l'email de la boutique et les prix.
2. Utilisez le bouton **Prévisualiser** pour passer une commande de test sans ouvrir le site au public, ou ouvrez les commandes puis passez une commande avec la carte de test Stripe `4242 4242 4242 4242` (date future, code 123).
3. Vérifiez : la commande apparaît dans **Commandes**, le client dans **Clients**, les emails sont reçus, le lien de suivi fonctionne.

### Ouvrir la boutique

1. Tableau de bord → **Ouvrir les commandes**, puis **Publier**.
2. Pour encaisser de vrais paiements : finalisez le compte Stripe (identité, IBAN), puis collez la clé `sk_live_…` dans l'onglet Installation et relancez.
3. Pour écrire aux clients depuis votre propre adresse : ajoutez votre nom de domaine dans Resend (*Domains*), puis indiquez l'expéditeur (ex. `Mon Truc en Bois <bonjour@montrucenbois.fr>`) dans l'onglet Installation.

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
Pour les visites du site, créez un compte gratuit sur goatcounter.com et indiquez son code dans **Infos boutique → Référencement et statistiques**.

### Google
Chaque produit a sa propre page optimisée (titre, description, photo, prix), recréée automatiquement à chaque publication, et le plan du site `sitemap.xml` est tenu à jour.
À faire une fois : déclarer le site dans [Google Search Console](https://search.google.com/search-console) avec le plan du site, et mettre le lien du site sur la fiche Google de la boutique et la page Facebook.

---

## En cas de souci

| Constat | Que faire |
|---|---|
| L'onglet Installation indique « projet introuvable ou en pause » | Un projet Supabase gratuit se met en pause après 7 jours sans aucune visite : ouvrez supabase.com et cliquez sur *Restore*. Le site interroge le serveur deux fois par semaine pour l'éviter (GitHub Actions). |
| L'installation échoue | Cliquez sur *Voir le journal détaillé* : le message en rouge donne la cause (jeton Supabase expiré, clé Stripe erronée…). Corrigez le champ concerné et relancez. |
| Les clients ne reçoivent pas d'email | Vérifiez dans Installation que les emails sont configurés, puis que votre domaine est vérifié dans Resend (sans domaine, Resend n'écrit qu'à votre propre adresse). |
| Un paiement n'apparaît pas comme payé | Vérifiez dans Installation que la « confirmation automatique » est active ; sinon relancez l'installation. En dernier recours, « Marquer comme payée » dans la commande. |
| Mot de passe administrateur oublié | Écran de connexion → *Mot de passe oublié*, ou choisissez-en un nouveau dans l'onglet Installation et relancez. |

---

## Pour les développeurs

- Base de données : `supabase/migrations/*.sql` (rejouables) — tables `commandes`, `clients`, `demandes`, `codes_promo`, `campagnes`, vue `stats_ventes`, accès réservés aux comptes de la table `admins` (RLS).
- Fonctions serveur (Deno) : `supabase/functions/` — `commande` (prix recalculés depuis le catalogue publié, codes promo, paiement Stripe), `suivi`, `contact` (devis, newsletter), `admin` (vente en boutique, emails, liens de paiement, campagnes), `stripe-webhook`. Tests : `deno test --allow-env --allow-read supabase/tests/`.
- Installation : `.github/workflows/supabase.yml`, déclenché par l'admin via `supabase/installation.json` (message de commit contenant `[installation]`).
- Pages produits et plan du site : `node outils/generer-pages.mjs`, lancé par `.github/workflows/pages-produits.yml` à chaque modification de `data/donnees.js`.
