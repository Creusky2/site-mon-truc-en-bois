# Mon Truc en Bois — site vitrine & boutique

Site de l'atelier de personnalisation (gravure, sérigraphie, photo, bijoux).
Site **statique** (HTML / CSS / JavaScript) : aucun serveur ni base de données à gérer, hébergement gratuit possible (GitHub Pages, Netlify…).

## Pages

| Page | Rôle |
|---|---|
| `index.html` | Accueil : savoir-faire, fonctionnement, coups de cœur |
| `boutique.html` | Catalogue avec filtres par catégorie |
| `produit.html?id=…` | Fiche produit : variante, texte, police, photo, **aperçu en direct** |
| `panier.html` | Panier, choix livraison / retrait, formulaire de commande |
| `atelier.html` | Présentation de l'atelier |
| `contact.html` | Coordonnées et demande de devis |
| `cgv.html`, `mentions-legales.html` | Pages légales (modèles à compléter) |

## Modifier le site

- **Coordonnées, frais de port** : `js/config.js`
- **Produits, prix, catégories** : `js/produits.js`
- **Photos** : déposer les images dans `img/` puis renseigner `image: "img/mon-produit.jpg"` dans `js/produits.js`
  (sans image, une illustration colorée s'affiche automatiquement)
- **Couleurs et polices** : variables en haut de `css/style.css`
- Les passages surlignés en jaune / entre crochets sont à compléter (présentation, SIRET, médiateur…)

## Fonctionnement des commandes

Le client remplit son panier puis envoie une **demande de commande**. Elle arrive par email au commerce, qui
recontacte le client pour valider la personnalisation (maquette) et encaisser le paiement
(virement, PayPal, lien de paiement, espèces au retrait…).

- Par défaut, la commande s'ouvre dans la messagerie du client (lien `mailto:`).
- **Recommandé** : créer un formulaire gratuit sur [formspree.io](https://formspree.io) et coller son adresse
  dans `formulaireCommande` (`js/config.js`). Les commandes et devis arrivent alors directement par email,
  sans action supplémentaire du client.

Pour aller plus loin (paiement par carte directement sur le site), on peut ajouter des liens de paiement
Stripe / SumUp / PayPal, ou brancher un service de panier comme Snipcart.

## Voir le site en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Mettre en ligne (GitHub Pages)

Dans le dépôt GitHub : **Settings → Pages → Source : Deploy from a branch → `main` / `(root)`**.
Le site sera disponible à l'adresse `https://<compte>.github.io/site-mon-truc-en-bois/`
(un nom de domaine personnalisé, ex. `montrucenbois.fr`, peut ensuite être branché).
