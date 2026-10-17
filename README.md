# Mon Truc en Bois — site vitrine & boutique

Site de la boutique de personnalisation **Mon Truc en Bois** — 3 rue Salengro, 62260 Auchel
(gravure texte & photo, sérigraphie, bijoux). Coordonnées, horaires et photos repris de la
[page Facebook](https://www.facebook.com/profile.php?id=100094575102607).

⚠️ Avant d'ouvrir les commandes : vérifier les **prix** (ce sont des exemples) et l'**email**, depuis la page admin.

Site **statique** (HTML / CSS / JavaScript) : aucun serveur ni base de données à gérer, hébergement gratuit possible (GitHub Pages, Netlify…).

## Gérer le site : la page admin

Ouvrir **`/admin.html`** (ex. `https://creusky2.github.io/site-mon-truc-en-bois/admin.html`).

- **Produits** : ajouter, modifier, dupliquer, masquer, supprimer, réordonner ; photo, prix, description,
  choix proposés (taille, finition…) avec supplément, « coup de cœur » pour la page d'accueil.
- **Catégories** : nom, description, photo de la tuile, ordre.
- **Infos boutique** : coordonnées, email, horaires, frais de livraison, mode « site en construction ».
- **Textes & annonce** : titre et texte d'accueil, présentation, bandeau d'annonce (fermeture, salon…).
- **Galerie** : photos des réalisations de la page « Qui sommes-nous ? ».

Les modifications sont enregistrées dans `data/donnees.js` sur GitHub en cliquant sur **Publier les modifications** ;
le site est à jour quelques minutes plus tard. Les photos ajoutées sont réduites automatiquement et rangées dans `img/`.

**Connexion** : la page demande une clé d'accès GitHub (*fine-grained personal access token*), limitée à ce dépôt
avec la permission **Contents : Read and write**. La marche à suivre est rappelée sur l'écran de connexion.
La clé reste enregistrée uniquement dans le navigateur de l'appareil utilisé.

## Pages

| Page | Rôle |
|---|---|
| `index.html` | Accueil : univers, coups de cœur, fonctionnement, horaires |
| `boutique.html` | Catalogue avec filtres, recherche et tri |
| `produit.html?id=…` | Fiche produit : choix, texte, police, photo, **aperçu en direct** |
| `panier.html` | Panier, livraison ou retrait, formulaire de commande |
| `atelier.html` | Qui sommes-nous ? (présentation, savoir-faire, galerie) |
| `contact.html` | Coordonnées, horaires, itinéraire, demande de devis |
| `cgv.html`, `mentions-legales.html` | Pages légales (modèles à compléter) |
| `admin.html` | Administration du contenu |

## Fichiers

- `data/donnees.js` : tout le contenu (infos, textes, catégories, produits, galerie) — modifié par l'admin
- `css/style.css` : design du site (couleurs et polices en haut du fichier) · `css/admin.css` : page admin
- `js/main.js` : en-tête, pied de page, panier · `js/admin.js` : page admin
- `img/` : photos

## Fonctionnement des commandes

Le client remplit son panier puis envoie une **demande de commande**. Elle arrive par email au commerce, qui
recontacte le client pour valider la personnalisation (maquette) et encaisser le paiement
(virement, PayPal, lien de paiement, espèces au retrait…).

- Par défaut, la commande s'ouvre dans la messagerie du client (lien `mailto:`).
- **Recommandé** : créer un formulaire gratuit sur [formspree.io](https://formspree.io) et coller son adresse
  dans l'admin (Infos boutique → Adresse Formspree). Les commandes et devis arrivent alors directement par email.
- Tant que le **mode « site en construction »** est actif, l'envoi des commandes et devis est bloqué.

## Voir le site en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Mise en ligne

Publié avec GitHub Pages depuis la branche `site-vitrine-boutique` (Settings → Pages).
