# Mon Truc en Bois — site vitrine & boutique

Site de la boutique de personnalisation **Mon Truc en Bois** — 3 rue Salengro, 62260 Auchel
(gravure texte & photo, sérigraphie, bijoux). Coordonnées, horaires et photos repris de la
[page Facebook](https://www.facebook.com/profile.php?id=100094575102607).

⚠️ Avant d'ouvrir les commandes : vérifier les **prix** (ce sont des exemples) et l'**email**, depuis la page admin.

Site **statique** (HTML / CSS / JavaScript) : aucun serveur ni base de données à gérer, hébergement gratuit possible (GitHub Pages, Netlify…).

## Gérer le site : la page admin

Ouvrir **`/admin.html`** (ex. `https://creusky2.github.io/site-mon-truc-en-bois/admin.html`).

- **Tableau de bord** : chiffres clés, liste de vérification avant d'ouvrir les commandes, raccourcis,
  sauvegarde / restauration du contenu, historique des publications.
- **Produits** : prix modifiables directement dans la liste, coup de cœur et visibilité en un clic ;
  fiche complète : plusieurs photos, prix barré, badge (Nouveau, Promo…), délai de fabrication,
  consigne de personnalisation, disponibilité, occasions, choix avec supplément.
- **Catégories & occasions** : catégories (photo, ordre) et occasions de la page « Idées cadeaux ».
- **Avis clients** : liens et scores Google / Facebook, avis affichés (source, produit lié),
  carte QR « Laissez-nous un avis » à imprimer, emplacement pour un widget d'avis automatique.
- **FAQ**.
- **Infos boutique** : coordonnées, WhatsApp, horaires, livraison, emballage cadeau, mode « site en construction ».
- **Textes & annonce** : textes d'accueil et de présentation, bandeau d'annonce avec lien.
- **Galerie** : photos des réalisations.

**Prévisualiser** affiche le site avec les modifications non publiées (sur cet appareil uniquement).
**Publier les modifications** enregistre `data/donnees.js` sur GitHub ; le site est à jour quelques minutes plus tard.
Les modifications en cours sont gardées automatiquement sur l'appareil en cas de fermeture de la page.

**Connexion** : la page demande une clé d'accès GitHub (*fine-grained personal access token*), limitée à ce dépôt
avec la permission **Contents : Read and write**. La marche à suivre est rappelée sur l'écran de connexion.
La clé reste enregistrée uniquement dans le navigateur de l'appareil utilisé.

## Pages

| Page | Rôle |
|---|---|
| `index.html` | Accueil : univers, coups de cœur, occasions, avis, fonctionnement, horaires |
| `boutique.html` | Catalogue : catégories, occasion, budget, recherche, tri |
| `idees-cadeaux.html` | Idées cadeaux par occasion et par budget |
| `produit.html?id=…` | Fiche produit : galerie, choix, texte, police, photo, **aperçu en direct**, délai, favori, partage |
| `favoris.html` | Produits mis de côté par le client |
| `panier.html` | Panier, livraison ou retrait, options cadeau, commande par email ou WhatsApp |
| `atelier.html` | Qui sommes-nous ? (présentation, savoir-faire, galerie) |
| `avis.html` | Avis clients Google et Facebook, boutons « Laisser un avis » |
| `faq.html` | Questions fréquentes |
| `suivi.html` | Suivi de commande, paiement en ligne d'une commande en attente |
| `contact.html` | Coordonnées, horaires, itinéraire, demande de devis |
| `cgv.html`, `mentions-legales.html` | Pages légales (modèles à compléter) |
| `admin.html` | Administration du contenu |

Le benchmark qui a guidé ces choix est dans [`docs/benchmark.md`](docs/benchmark.md).

## Fichiers

- `data/donnees.js` : tout le contenu (infos, textes, catégories, produits, galerie) — modifié par l'admin
- `css/style.css` : design du site (couleurs et polices en haut du fichier) · `css/admin.css` : page admin
- `js/main.js` : en-tête, pied de page, panier · `js/admin.js` : page admin
- `img/` : photos

## Fonctionnement des commandes

**Avec les commandes en ligne activées** (Supabase + Stripe + Resend, guide pas à pas : [`docs/mise-en-ligne.md`](docs/mise-en-ligne.md)) :

1. Le client valide son panier et choisit son paiement : **carte en ligne**, **après validation de la maquette**
   (lien envoyé depuis l'admin) ou **à la boutique** au retrait.
2. La commande est enregistrée (prix recalculés côté serveur), les photos du client sont envoyées en haute qualité,
   la boutique et le client reçoivent un email.
3. Le commerçant gère tout dans l'admin, onglet **Commandes** : statuts (le client est prévenu par email),
   lien de paiement, paiement en boutique, photos, notes internes, bon de commande, facture numérotée, export tableur.
4. Le client suit sa commande sur `suivi.html` (lien reçu par email, ou numéro + email).

**Sans activation** : la commande part par email (Formspree si configuré, sinon messagerie du client) ou WhatsApp.

Tant que le **mode « site en construction »** est actif, l'envoi des commandes et devis est bloqué (côté site et côté serveur).

### Partie serveur

| Dossier | Contenu |
|---|---|
| `supabase/migrations/` | Tables, sécurité (RLS), numéros de commande et de facture, stockage des photos |
| `supabase/functions/` | Fonctions Deno : `commande`, `stripe-webhook`, `suivi`, `admin` |
| `supabase/tests/` | Tests des fonctions (`deno test --allow-env --allow-read supabase/tests/`) |
| `.github/workflows/` | Déploiement des fonctions sur Supabase, maintien du projet actif |

## Voir le site en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Mise en ligne

Publié avec GitHub Pages depuis la branche `site-vitrine-boutique` (Settings → Pages).
