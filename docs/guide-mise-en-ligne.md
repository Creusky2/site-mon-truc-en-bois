# Guide de mise en ligne pas à pas — Mon Truc en Bois

Oct 18, 2026 · @Creusky

Douze phases, environ une journée d'agence répartie sur une semaine (délais des DNS et de validation Stripe compris), puis une heure avec le commerçant. Tout le code est prêt : ce guide ne fait qu'ouvrir les comptes, coller les clés au bon endroit et vérifier. La partie légale est mise de côté et se complètera dans l'admin sans rien changer d'autre.

| Phase | Qui | Durée | Statut |
| --- | --- | --- | --- |
| Avant de commencer | Agence + client | 30 min | À faire |
| 1. Nom de domaine et Cloudflare | Agence | 30 min (+ jusqu'à 24 h de DNS) | À faire |
| 2. Dépôt GitHub et clés | Agence | 20 min | À faire |
| 3. Hébergement Cloudflare Pages | Agence | 20 min | À faire |
| 4. Supabase | Agence | 15 min | À faire |
| 5. Brevo | Agence | 30 min (+ DNS) | À faire |
| 6. Stripe | Agence + client | 20 min (+ 1 à 3 jours de validation) | À faire |
| 7. Assistant d'installation | Agence | 15 min | À faire |
| 8. Contenu et réglages | Agence + client | 30 min | À faire |
| 9. Surveillance et Google | Agence | 20 min | À faire |
| 10. Tests de bout en bout | Agence | 45 min | À faire |
| 11. Ouverture | Agence | 20 min | À faire |
| 12. Remise au commerçant | Agence + client | 1 h | À faire |

## Avant de commencer

Tous les comptes s'ouvrent au nom du client, qui en reste propriétaire ; l'agence y est invitée comme administratrice. Chaque clé créée va dans le coffre de mots de passe de l'agence avant d'être collée dans l'admin.

**À demander au client**

- [ ] L'adresse email où il veut recevoir commandes et messages (sa boîte actuelle convient).
- [ ] Son numéro de mobile (validation des comptes Stripe et Cloudflare).
- [ ] Le nom de domaine voulu : montrucenbois.fr par défaut, à vérifier libre.
- [ ] Les vrais prix, ou un rendez-vous pour les revoir ensemble dans l'admin.
- [ ] Son terminal de carte bancaire actuel, s'il en a un.
- [ ] Pour Stripe : pièce d'identité, IBAN du compte professionnel, numéro SIRET.
- [ ] Une carte bancaire pour le domaine (\~10 €/an) et Supabase Pro (25 $/mois à l'ouverture).

**Côté agence**

- Un compte GitHub avec une organisation d'agence (gratuite).
- Un coffre de mots de passe partagé (Bitwarden, 1Password…), avec une fiche « Mon Truc en Bois ».
- L'admin du site : `https://noedio.github.io/site-mon-truc-en-bois/admin.html` jusqu'à la phase 3, puis `https://montrucenbois.fr/admin.html`.

| Clé ou identifiant | Où elle est utilisée | À noter dans le coffre |
| --- | --- | --- |
| Clé GitHub de l'agence | Navigateur de l'agence (« Accès agence ») | Oui, avec sa date d'expiration |
| Clé de publication | Secrets du serveur, via l'assistant | Oui, avec sa date d'expiration |
| Jeton Supabase, clés Stripe et Brevo | Secrets GitHub puis serveur, via l'assistant | Oui |
| Email et mot de passe du commerçant | Le commerçant seulement | Non : il change le mot de passe à la remise |

## Phase 1 — Nom de domaine et Cloudflare

Objectif : montrucenbois.fr appartient au client, ses DNS sont gérés par Cloudflare, et contact@montrucenbois.fr arrive dans sa boîte actuelle.

1. Sur [ovhcloud.com](https://www.ovhcloud.com/fr/domains/), rechercher **montrucenbois.fr** et le commander. Titulaire : le client (ses nom et adresse), paiement avec sa carte, renouvellement automatique activé.
2. Dans l'espace client OVH : *Web Cloud* → *Noms de domaine* → montrucenbois.fr → onglet *DNSSEC* : le **désactiver** s'il est actif (sinon le passage à Cloudflare coupe le domaine pendant plusieurs heures).
3. Créer le compte sur [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) avec l'email du client. Puis *Manage Account* → *Members* → inviter l'email de l'agence avec le rôle **Administrator**.
4. Dans Cloudflare : *Add a domain* → montrucenbois.fr → formule **Free** → continuer jusqu'à l'écran qui affiche **deux serveurs de noms** (`….ns.cloudflare.com`).
5. Chez OVH : onglet *Serveurs DNS* → *Modifier les serveurs DNS* → remplacer par les deux noms Cloudflare → appliquer.
6. Attendre l'email « montrucenbois.fr is now active » de Cloudflare (quelques minutes à 24 h). Ensuite seulement : *DNS* → *Settings* → réactiver **DNSSEC** depuis Cloudflare.
7. *Email* → *Email Routing* → *Get started* : adresse personnalisée **contact**, destination = la boîte du client. Cloudflare ajoute lui-même les enregistrements MX ; le client clique sur l'email de vérification qu'il reçoit.

**Vérification** : un email envoyé à contact@montrucenbois.fr depuis une autre adresse arrive dans la boîte du client.

## Phase 2 — Dépôt GitHub et clés

Objectif : le code est chez l'agence, et deux clés existent : celle de l'agence (installation) et la clé de publication (qui laisse le commerçant modifier le site, rien d'autre).

1. **Facultatif, recommandé si l'agence a plusieurs clients** : créer une organisation sur [github.com/organizations/plan](https://github.com/organizations/plan) (formule Free), puis dans le dépôt *Settings* → *General* → *Transfer ownership* vers cette organisation. Le dépôt reste **public** jusqu'à la phase 11.
2. Dans le dépôt : *Settings* → *General* → *Default branch* → choisir **site-vitrine-boutique** (la branche du site). Sans cela, la tâche qui garde Supabase gratuit éveillé ne tourne jamais : GitHub ne lance les tâches planifiées que depuis la branche par défaut.
3. Si l'organisation est nouvelle : *Settings* de l'organisation → *Personal access tokens* → autoriser les clés « fine-grained ».
4. **Clé de l'agence** sur [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new) : nom « Admin site Mon Truc en Bois », propriétaire = l'organisation (ou le compte), expiration 1 an, *Only select repositories* → site-mon-truc-en-bois. Permissions du dépôt : **Contents**, **Secrets**, **Variables** en *Read and write*, **Actions** en *Read-only*.
5. **Clé de publication**, même page : nom « Publication commerçant », mêmes propriétaire, dépôt et expiration, permission **Contents** en *Read and write* seulement. La garder pour la phase 7.
6. Noter les deux dates d'expiration dans le coffre et dans l'agenda de l'agence (un mois avant).
7. Ouvrir l'admin → *Accès agence* → coller la clé de l'agence. Si le dépôt a été transféré : *Réglages avancés* → *Compte GitHub* = le nom de l'organisation.

**Vérification** : l'admin s'ouvre, l'onglet *Installation* affiche « Votre clé GitHub a les droits nécessaires », et la page du dépôt sur GitHub s'ouvre sur la branche `site-vitrine-boutique`.

## Phase 3 — Hébergement Cloudflare Pages

Objectif : le site est servi par Cloudflare sur https://montrucenbois.fr, et se remet en ligne tout seul à chaque publication depuis l'admin.

1. Cloudflare → *Workers & Pages* → *Create* → onglet **Pages** → *Import an existing Git repository*. Autoriser l'application Cloudflare sur GitHub, pour ce seul dépôt.
2. Réglages du projet :
   - Nom du projet : `mon-truc-en-bois`
   - Branche de production : `site-vitrine-boutique`
   - Framework preset : *None*
   - Build command : `node outils/construire.mjs`
   - Build output directory : `dist`
   - Variable d'environnement : `NODE_VERSION` = `22`
3. *Save and Deploy*, attendre la fin (environ une minute), puis ouvrir l'adresse `mon-truc-en-bois.pages.dev`.
4. *Settings* → *Builds & deployments* → *Preview branches* : **None** (seule la branche du site est mise en ligne).
5. *Custom domains* → ajouter **montrucenbois.fr**, puis **www.montrucenbois.fr** (Cloudflare crée les enregistrements DNS). Pour rediriger www vers l'adresse sans www : *Rules* → *Redirect Rules* → modèle *Redirect from WWW to root*.
6. Onglet *Metrics* du projet → activer **Web Analytics** (statistiques de visite sans cookie).
7. Sur GitHub, dans le dépôt : *Settings* → *Secrets and variables* → *Actions* → onglet *Variables* → créer `HEBERGEMENT` = `cloudflare` (Cloudflare génère désormais les pages produits).

**Vérification** : https://montrucenbois.fr affiche le site avec le cadenas, https://montrucenbois.fr/p/mug-personnalise.html affiche la fiche du mug, et https://montrucenbois.fr/admin.html la connexion. Le site reste aussi sur GitHub Pages jusqu'à la phase 11.

## Phase 4 — Supabase

Objectif : un projet Supabase à Paris existe, et trois valeurs sont dans le coffre : son adresse, sa clé publique et un jeton d'accès.

1. Créer le compte sur [supabase.com/dashboard/sign-up](https://supabase.com/dashboard/sign-up) avec l'email du client ; organisation « Mon Truc en Bois », formule **Free** pour l'instant. Dans l'organisation : *Team* → inviter l'email de l'agence en **Owner**.
2. *New project* : nom `mon-truc-en-bois`, mot de passe de base de données : *Generate a password* (le ranger dans le coffre, l'admin n'en a pas besoin), région **West EU (Paris)**. *Create new project*, attendre environ deux minutes.
3. Bouton **Connect** en haut de page, ou *Project Settings* → *API Keys* :
   - l'**adresse du projet** : `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`
   - la clé **anon public**, onglet *Legacy API keys* (elle commence par `eyJ`). Si les clés « legacy » sont désactivées, les réactiver sur cette page.
4. Avatar en haut à droite → *Account preferences* → *Access Tokens* → *Generate new token* : nom « Installation site Mon Truc en Bois », l'expiration la plus longue proposée. Copier le jeton (`sbp_…`), il ne s'affiche qu'une fois.

Ne jamais copier la clé « service\_role » ou « secret » : l'assistant la récupère lui-même et refuse qu'on la colle.

**Vérification** : les trois valeurs sont dans le coffre ; le tableau de bord Supabase affiche le projet en état *Healthy*.

## Phase 5 — Brevo

Objectif : les emails du site (commandes, suivi, devis, newsletter, mot de passe oublié) partent de contact@montrucenbois.fr et arrivent en boîte de réception, pas en indésirables.

1. Créer le compte gratuit sur [brevo.com](https://onboarding.brevo.com/account/register) avec l'email du client. Puis *Paramètres* → *Utilisateurs* → inviter l'email de l'agence avec tous les droits.
2. Menu du compte → **SMTP & API** :
   - onglet *Clés API* → *Générer une nouvelle clé API* → nom « Site » → copier la clé (`xkeysib-…`) ;
   - onglet *SMTP* → copier l'**identifiant** (`…@smtp-brevo.com`) → *Générer une nouvelle clé SMTP* → copier la clé (`xsmtpsib-…`).
3. *Expéditeurs, domaines et IP dédiées* → *Domaines* → *Ajouter un domaine* → montrucenbois.fr → *Authentifier*. Brevo affiche trois à quatre enregistrements (code Brevo, DKIM, DMARC).
4. Dans Cloudflare → *DNS* → *Records* → *Add record* : recopier chacun à l'identique (type, nom, valeur). Pour les enregistrements CNAME, décocher le nuage orange (*DNS only*).
5. Revenir dans Brevo → *Vérifier* : le domaine passe en « Authentifié » (quelques minutes, parfois une heure).
6. *Expéditeurs* → *Ajouter un expéditeur* : nom « Mon Truc en Bois », email `contact@montrucenbois.fr`.

**Vérification** : le domaine et l'expéditeur apparaissent en vert dans Brevo ; les deux clés et l'identifiant SMTP sont dans le coffre.

## Phase 6 — Stripe

Objectif : le compte Stripe du client est prêt à l'image de la boutique, et sa clé de test est dans le coffre. La validation du compte (identité, IBAN) avance en parallèle.

1. Créer le compte sur [dashboard.stripe.com/register](https://dashboard.stripe.com/register) avec l'email du client, pays **France**. *Paramètres* → *Équipe et sécurité* → inviter l'email de l'agence en **Administrateur**.
2. *Paramètres* → *Informations publiques* : nom public « Mon Truc en Bois », email d'assistance `contact@montrucenbois.fr`, téléphone de la boutique, site `https://montrucenbois.fr`, libellé sur les relevés bancaires **MONTRUCENBOIS**.
3. *Paramètres* → *Image de marque* : logo (fichier `img/logo-email.png` du site), couleur d'accentuation **#24453a**.
4. *Paramètres* → *E-mails clients* : activer les reçus pour les paiements réussis et les remboursements.
5. Avec le client (10 minutes) : *Activer les paiements* → identité, IBAN, SIRET. Stripe valide en un à trois jours ; le site fonctionne en mode test en attendant.
6. Mode **test** activé (interrupteur en haut) → *Développeurs* → *Clés API* → *Clé secrète* → *Révéler* → copier `sk_test_…`.

Ne pas créer de webhook à la main : l'assistant d'installation le crée et le relie au serveur.

**Vérification** : la clé de test est dans le coffre ; le client a reçu l'email de confirmation de Stripe.

## Phase 7 — Assistant d'installation

Objectif : un clic installe la base de données, le compte du commerçant, les fonctions serveur, le webhook Stripe et les emails ; toutes les vérifications passent au vert.

1. Ouvrir **https://montrucenbois.fr/admin.html** (l'adresse définitive : elle est retenue comme adresse autorisée du serveur) → *Accès agence* → clé de l'agence → onglet **Installation**.
2. Remplir les champs avec les valeurs du coffre :

| Étape de l'assistant | Champ | Valeur |
| --- | --- | --- |
| 2. Serveur Supabase | Adresse du projet | Phase 4 (`https://….supabase.co`) |
| 2. Serveur Supabase | Clé publique « anon public » | Phase 4 (`eyJ…`) |
| 2. Serveur Supabase | Jeton d'accès Supabase | Phase 4 (`sbp_…`) |
| 3. Compte du commerçant | Email administrateur | L'email du client |
| 3. Compte du commerçant | Mot de passe, confirmation | Un mot de passe provisoire de 10 caractères ou plus, noté dans le coffre |
| 3. Compte du commerçant | Clé de publication | Phase 2 (`github_pat_…`, la clé « Contents » seule) |
| 4. Stripe | Clé secrète Stripe | Phase 6 (`sk_test_…`) ; case « paiement par carte » cochée |
| 5. Brevo | Clé Brevo | Phase 5 (`xkeysib-…`) |
| 5. Brevo | Identifiant SMTP, clé SMTP | Phase 5 (`…@smtp-brevo.com`, `xsmtpsib-…`) |
| 5. Brevo | Expéditeur des emails | `Mon Truc en Bois <contact@montrucenbois.fr>` |
| 5. Brevo | Email qui reçoit les commandes et devis | `contact@montrucenbois.fr` |
| 6. Lancer | Adresse du site (avancé) | `https://montrucenbois.fr` |

3. **Installer le serveur**. La progression s'affiche étape par étape (2 à 4 minutes).
4. À la fin, se connecter dans l'encadré « État du serveur » avec l'email et le mot de passe provisoire.

**Vérification** : toutes les lignes de l'état du serveur sont vertes : projet joignable, base de données, cinq fonctions, compte administrateur, modification du site par le commerçant (avec la date d'expiration de la clé), paiement par carte en mode test avec confirmation automatique, emails par Brevo.

En cas d'échec, *Voir le journal détaillé* : la ligne en rouge donne la cause (jeton recopié incomplet, projet Supabase pas encore prêt…). Corriger le champ concerné et relancer ; l'installation ne supprime jamais rien.

## Phase 8 — Contenu et réglages de la boutique

Objectif : le site affiche les vraies informations et les vrais prix ; il reste en mode « site en construction » (commandes fermées au public) jusqu'à la phase 11.

1. Onglet **Infos boutique** :
   - Email : `contact@montrucenbois.fr` ; téléphone, horaires, WhatsApp, Facebook, Instagram à relire avec le client ;
   - *Commandes en ligne et paiement* : cocher la carte, « après validation de la maquette » et « à la boutique » selon le choix du client ;
   - Livraison (5,90 €, offerte dès 60 €) et emballage cadeau : à confirmer avec lui ;
   - *Référencement* : adresse publique du site = `https://montrucenbois.fr` ;
   - *Informations légales* : seulement *Hébergement du site* = Cloudflare Pages pour l'instant, le reste sera complété avec le client.
2. Onglet **Produits** : revoir les prix avec le client (directement dans la liste), puis cocher *Prix vérifiés* sur le tableau de bord. Au même endroit, cocher *Vérifiée* en face de l'adresse email de la boutique (le test de la phase 1 a montré que les messages y arrivent) : les deux cases sont nécessaires pour ouvrir les commandes.
3. Onglet **Avis clients** : lien de la fiche Google de la boutique et lien « laisser un avis ».
4. **Publier les modifications**. Cloudflare remet le site en ligne en une à deux minutes.

**Vérification** : sur https://montrucenbois.fr, les prix et l'email sont les bons ; le code source d'une page produit (clic droit → *Afficher le code source*) contient `https://montrucenbois.fr/p/…` dans la balise canonical. Les mentions légales affichent encore « \[à compléter\] » : c'est attendu.

## Phase 9 — Surveillance et Google

Objectif : l'agence est prévenue en cas de panne avant le client, et Google connaît le site et ses pages produits.

1. Sur [betterstack.com](https://betterstack.com/uptime), avec le compte de l'agence (un seul pour tous ses clients) → *Monitors* → *Create monitor*, deux fois :
   - **Site** : URL `https://montrucenbois.fr`, alerte si le mot « Mon Truc en Bois » n'apparaît plus ;
   - **Serveur** : URL `https://xxxxxxxxxxxxxxxxxxxx.supabase.co/functions/v1/suivi?sante=1` (l'adresse du projet de la phase 4), alerte si la page ne répond plus 200. Ce contrôle interroge la base de données : il détecte aussi un projet en pause.
   - Alertes : email et SMS de la personne d'astreinte à l'agence.
2. Sur [search.google.com/search-console](https://search.google.com/search-console), avec le compte Google du client : *Ajouter une propriété* → **Domaine** → montrucenbois.fr. Google donne un enregistrement TXT : l'ajouter dans Cloudflare → *DNS* → *Records*, puis *Valider*. Ajouter l'agence comme utilisateur.
3. *Sitemaps* → soumettre `https://montrucenbois.fr/sitemap.xml`.
4. Fiche Google de la boutique (Google Business Profile) et page Facebook : remplacer le lien du site par `https://montrucenbois.fr`.

**Vérification** : les deux sondes Better Stack sont vertes ; Search Console affiche le sitemap « Réussi » avec 37 pages découvertes (sous quelques jours).

## Phase 10 — Tests de bout en bout

Objectif : chaque parcours a été fait une fois en vrai, en mode test Stripe, avant que le site soit annoncé. Le serveur refuse les commandes tant que le site est « en construction » : on ouvre donc les commandes maintenant, sans encore communiquer l'adresse.

Tableau de bord → **Ouvrir les commandes** → **Publier**. Puis, dans l'ordre, sur ordinateur et sur téléphone :

- [ ] **Commande payée par carte** : un produit avec texte et photo, retrait en boutique, carte de test `4242 4242 4242 4242` (date future, code 123). La page de suivi indique « payée » ; le client et contact@ reçoivent leurs emails ; dans l'admin la commande a sa photo téléchargeable et sa facture.
- [ ] **Commande « payer après validation »** avec livraison : dans l'admin, statut *Maquette validée* puis *Envoyer un lien de paiement* ; le client reçoit l'email, paie avec la carte de test, la commande passe « payée ».
- [ ] **Code promo** : *Marketing* → créer `BIENVENUE10` (10 %) ; dans le panier la remise s'affiche et se retrouve sur la page de paiement Stripe.
- [ ] **Devis** depuis la page Contact : il arrive dans *Demandes* et par email ; *Répondre par email* depuis l'admin.
- [ ] **Newsletter** : inscription en pied de page, email de confirmation, puis son lien *Se désinscrire* → **Me désinscrire** ; la fiche client n'est plus abonnée. Depuis la page newsletter sans ce lien, la désinscription envoie d'abord un email de confirmation.
- [ ] **Email aux abonnés** : *Marketing* → *M'envoyer un essai*.
- [ ] **Caisse** : une vente réglée en espèces (par carte si le client est assujetti à la TVA : la caisse refuse alors les espèces), facture imprimée.
- [ ] **Connexion du commerçant**, en navigation privée : email et mot de passe provisoire ; l'onglet Installation n'apparaît pas ; modifier un prix, publier, le voir sur le site en deux minutes, remettre le prix.
- [ ] **Mot de passe oublié**, en navigation privée : l'email en français arrive de contact@ ; choisir un nouveau mot de passe ouvre l'admin.
- [ ] **Remboursement** : rembourser la première commande dans Stripe, puis *Marquer comme remboursée* dans l'admin ; la commande ne propose plus de lien de paiement.
- [ ] **Raccourci téléphone** : ajouter l'admin à l'écran d'accueil d'un téléphone ; il s'ouvre en plein écran, sans la barre du navigateur.
- [ ] **Surveillance** : les deux sondes Better Stack sont toujours vertes.

Si un email n'arrive pas : vérifier les indésirables, puis l'onglet *Installation* (ligne Emails) et le journal *Transactionnel* de Brevo, qui donne la raison de chaque refus.

## Phase 11 — Ouverture

Objectif : les tests sont effacés, les paiements sont réels, le serveur ne peut plus se mettre en pause, et le site n'existe plus qu'à son adresse définitive.

1. **Effacer les données de test** : Supabase → *SQL Editor* → *New query*, coller puis *Run* :

```sql
delete from public.commandes;
delete from public.demandes;
delete from public.clients;
delete from public.campagnes;
delete from public.codes_promo;
alter sequence public.commandes_numero_seq restart with 1;
alter sequence public.factures_numero_seq restart with 1;
```

Puis *Storage* → *photos-clients* : supprimer les dossiers des commandes de test. Les numéros de commande et de facture repartent à 0001, sans trou dans la numérotation des factures réelles. Les codes promo de test (`BIENVENUE10`) sont effacés aussi : recréer avec le client les vrais codes dans *Marketing*.

2. **Paiements réels**, une fois le compte Stripe validé : quitter le mode test → *Développeurs* → *Clés API* → copier `sk_live_…` → admin → *Installation* → étape 4 → coller → *Enregistrer et relancer l'installation*. L'état affiche « Mode réel » avec confirmation automatique.
3. **Supabase Pro** : organisation → *Billing* → passer en **Pro** avec la carte du client.
4. **Couper GitHub Pages** : dépôt → *Settings* → *Pages* → *Unpublish site*. Puis *Settings* → *General* → *Change visibility* → **Private**.
5. **Commande réelle** du produit le moins cher avec une vraie carte, vérifier l'argent en attente dans Stripe, puis rembourser (seuls les frais Stripe, quelques centimes, ne sont pas rendus).
6. Annoncer le site : publication Facebook, lien dans la bio Instagram, carte QR « Laissez-nous un avis » imprimée depuis l'onglet *Avis clients*.

**Vérification** : l'onglet *Installation* est tout vert en mode réel ; l'ancienne adresse github.io ne répond plus ; https://montrucenbois.fr fonctionne après le passage du dépôt en privé (publier une petite modification pour le confirmer).

## Phase 12 — Remise au commerçant

Objectif : en une heure, sur son téléphone, le commerçant sait faire seul tout ce dont il a besoin chaque jour ; il a choisi son propre mot de passe.

1. Sur son téléphone : ouvrir `https://montrucenbois.fr/admin.html`, se connecter, puis l'ajouter à l'écran d'accueil (iPhone : *Partager* → *Sur l'écran d'accueil* ; Android : menu ⋮ → *Ajouter à l'écran d'accueil*).
2. Il choisit son mot de passe : *Déconnexion* → *Mot de passe oublié ?* → email → nouveau mot de passe. L'agence ne le connaît plus ; retirer le mot de passe provisoire du coffre.
3. Le tour de l'admin, en faisant faire chaque geste :
   - **Commandes** : changer un statut (le client est prévenu tout seul), envoyer un lien de paiement, télécharger une photo, imprimer une facture ;
   - **Caisse** : une vente en boutique ;
   - **Demandes** : répondre à un devis, le transformer en commande ;
   - **Clients** : retrouver un client, ajouter une note ;
   - **Produits** : changer un prix, ajouter une photo prise avec le téléphone, masquer un produit, puis **Publier** ;
   - **Textes & annonce** : une annonce de fermeture ou de salon ;
   - **Marketing** : un code promo et son texte à partager sur Facebook ;
   - **Tableau de bord** : chiffre d'affaires et demandes à traiter.
4. Installer l'application **Stripe** sur son téléphone (notification à chaque paiement) avec son compte.
5. Lui laisser le contact de l'agence et le [Guide du commerçant](guide-commercant.md) imprimé, avec sa page « Au quotidien » à garder près de la caisse.

**Vérification** : il se connecte seul avec son nouveau mot de passe, publie une modification et la retrouve sur le site.

## Après la mise en ligne

L'agence tient ce calendrier ; le commerçant ne fait que l'export mensuel.

| Quand | Quoi | Qui |
| --- | --- | --- |
| Chaque mois | Exporter commandes et factures (onglet Commandes → *Exporter*) pour le comptable | Commerçant |
| Chaque mois | Ouvrir l'onglet *Installation* : tout doit être vert | Agence |
| Dès que le client a les informations | *Infos boutique* → *Informations légales* (exploitant, forme, SIRET, régime de TVA, médiateur) : CGV, mentions légales et factures se mettent à jour seules | Agence + client |
| Chaque trimestre | Une commande de test en mode réel, remboursée ; lecture des alertes Better Stack | Agence |
| Un mois avant l'expiration | Nouvelle clé de publication (Contents seule) collée à l'étape 3 de l'assistant, puis relance ; nouvelle clé de l'agence | Agence |
| Chaque année | Renouvellement du domaine (automatique, vérifier la carte) | Agence |
| Avant septembre 2027 | Facture électronique : relier les factures à la plateforme agréée du client | Agence |

**Dépannage**

| Constat | Que faire |
| --- | --- |
| Le commerçant voit le bandeau « Publication indisponible » (clé de publication expirée ou révoquée, GitHub injoignable) | Nouvelle clé de publication à l'étape 3 de l'assistant, puis relancer. En attendant, ses commandes, sa caisse et ses clients fonctionnent. |
| Sonde « Serveur » rouge | Ouvrir Supabase : projet en pause ou incident ; *Restore* si besoin, puis relancer l'installation. En formule gratuite, vérifier que la branche par défaut du dépôt est `site-vitrine-boutique` (phase 2) : la tâche « garder le projet actif » ne tourne que depuis celle-ci. |
| Paiement non marqué « payé » | Onglet *Installation* : la confirmation automatique doit être active, sinon relancer ; en dernier recours *Marquer comme payée*. |
| Email « À vérifier : paiement reçu pour une commande annulée / remboursée » | Un client a payé avec un ancien lien. La commande n'a pas changé : rembourser ce paiement dans Stripe, ou reprendre la commande avec le client. |
| Emails non reçus | Journal *Transactionnel* de Brevo (raison du refus), puis domaine et expéditeur validés. |
| Le site n'a pas changé après une publication | Cloudflare → projet `mon-truc-en-bois` → *Deployments* : la dernière mise en ligne et son journal. |

Le détail technique est dans [technique.md](technique.md), le choix des plateformes dans le [benchmark des plateformes](benchmark-plateformes.md).
