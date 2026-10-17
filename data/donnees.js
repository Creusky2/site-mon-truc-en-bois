// ============================================================
//  DONNÉES DU SITE — modifiées depuis la page admin (admin.html).
//  On peut aussi éditer ce fichier à la main : il doit rester du JSON valide après « window.DONNEES = ».
// ============================================================
window.DONNEES = {
  "site": {
    "apercu": true,
    "nom": "Mon Truc en Bois",
    "slogan": "Personnalisation, sérigraphie, gravure texte & photo, bijoux",
    "telephone": "07 83 39 40 28",
    "email": "contact@montrucenbois.fr",
    "adresse": "3 rue Salengro, 62260 Auchel",
    "horaires": [
      "Lundi : fermé",
      "Mardi : 9h – 11h30 / 13h30 – 18h",
      "Mercredi : fermé",
      "Jeudi : 9h – 11h30 / 13h30 – 19h",
      "Vendredi : 9h – 11h30 / 13h30 – 19h",
      "Samedi : 10h – 19h",
      "Dimanche : 10h – 13h"
    ],
    "facebook": "https://www.facebook.com/profile.php?id=100094575102607",
    "avis": "Recommandé à 100 % · 16 avis",
    "formulaireCommande": "",
    "livraison": 5.9,
    "livraisonOfferteDes": 60,
    "whatsapp": "",
    "emballage": {
      "actif": false,
      "prix": 2.5
    }
  },
  "annonce": {
    "actif": false,
    "texte": "La boutique sera fermée du mercredi 21 au mercredi 28 octobre.",
    "lien": ""
  },
  "textes": {
    "heroTitre": "Offrez un cadeau unique, qui restera gravé dans les mémoires",
    "heroTexte": "Gravure texte et photo, sérigraphie, bijoux : nous personnalisons vos idées cadeaux dans notre boutique d’Auchel, pour toutes les occasions.",
    "equipe": "Christophe et Laetitia",
    "aPropos": [
      "Depuis 2024, Mon Truc en Bois vous accueille au cœur d’Auchel. Christophe et Laetitia y imaginent et fabriquent des cadeaux personnalisés pour toutes les occasions : naissance, baptême, mariage, fête des pères et des mères, départ en retraite, Noël…",
      "Gravure laser sur bois, verre et ardoise, impression sur mugs, verres et textiles, bijoux gravés : chaque pièce est unique et préparée avec soin. Particuliers, commerçants, associations et entreprises : nous réalisons aussi bien une pièce unique que des séries.",
      "Vous nous croiserez aussi sur les salons, marchés et fêtes de la région !"
    ]
  },
  "galerie": [
    "img/decor-hiboux.jpg",
    "img/cadre-mariage.jpg",
    "img/plaque-naissance-bois.jpg",
    "img/photo-gravee-bois.jpg",
    "img/tableau-scrabble.jpg",
    "img/baskets-personnalisees.jpg",
    "img/verres-graves.jpg",
    "img/salon-stand.jpg"
  ],
  "categories": [
    {
      "id": "gravure",
      "nom": "Gravure bois",
      "description": "Planches, plaques, panneaux, ardoises : vos textes et vos photos gravés au laser.",
      "image": "img/photo-gravee-bois.jpg"
    },
    {
      "id": "serigraphie",
      "nom": "Sérigraphie & impression",
      "description": "Mugs, verres, plaques voiture, baskets, stickers : imprimés à votre image.",
      "image": "img/mug-personnalise.jpg"
    },
    {
      "id": "evenements",
      "nom": "Naissance, mariage & fêtes",
      "description": "Plaques de naissance, panneaux de bienvenue, urnes, souvenirs de mariage.",
      "image": "img/plaque-naissance-bois.jpg"
    },
    {
      "id": "bijoux",
      "nom": "Bijoux & accessoires",
      "description": "Bracelets, boîtes à bijoux et porte-clés gravés, à offrir ou à s'offrir.",
      "image": "img/bracelet-jonc.jpg"
    }
  ],
  "produits": [
    {
      "id": "planche-aperitif",
      "nom": "Planche apéro gravée",
      "categorie": "gravure",
      "prix": 24.9,
      "image": "img/planche-aperitif.jpg",
      "description": "Planche en bois gravée avec le message de votre choix, avec ou sans illustration. Le cadeau parfait pour un papa, un parrain ou un ami.",
      "options": {
        "texte": true,
        "photo": false
      },
      "variantes": {
        "nom": "Taille",
        "choix": [
          {
            "nom": "Moyenne",
            "prix": 0
          },
          {
            "nom": "Grande",
            "prix": 8
          }
        ]
      },
      "visible": true,
      "vedette": true,
      "images": [
        "img/planche-aperitif.jpg"
      ],
      "occasions": [
        "fete-peres",
        "anniversaire",
        "noel"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "plaque-message",
      "nom": "Plaque bois à message",
      "categorie": "gravure",
      "prix": 29.9,
      "image": "img/plaque-message.jpg",
      "description": "Tranche de bois gravée d'une citation, d'un mot doux ou d'un message d'amitié, avec petits cœurs en relief.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/plaque-message.jpg"
      ],
      "occasions": [
        "anniversaire",
        "remerciement",
        "fete-meres"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "verres-graves",
      "nom": "Verres & flûtes gravés",
      "categorie": "gravure",
      "prix": 12.9,
      "image": "img/verres-graves.jpg",
      "description": "Flûtes à champagne, verres à vin ou chopes gravés aux prénoms et à la date : parfait pour un mariage ou un anniversaire. Prix à l'unité.",
      "options": {
        "texte": true,
        "photo": false
      },
      "variantes": {
        "nom": "Modèle",
        "choix": [
          {
            "nom": "Flûte",
            "prix": 0
          },
          {
            "nom": "Verre à vin",
            "prix": 0
          },
          {
            "nom": "Chope",
            "prix": 3
          }
        ]
      },
      "visible": true,
      "vedette": true,
      "images": [
        "img/verres-graves.jpg"
      ],
      "occasions": [
        "mariage",
        "anniversaire",
        "noel"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "photo-gravee-bois",
      "nom": "Photo gravée sur bois",
      "categorie": "gravure",
      "prix": 39.9,
      "image": "img/photo-gravee-bois.jpg",
      "description": "Votre photo (animaux, famille, paysage) gravée au laser sur bois, avec prénoms ou texte. Un rendu authentique et intemporel.",
      "options": {
        "texte": true,
        "photo": true
      },
      "variantes": {
        "nom": "Format",
        "choix": [
          {
            "nom": "20 × 30 cm",
            "prix": 0
          },
          {
            "nom": "30 × 40 cm",
            "prix": 15
          }
        ]
      },
      "visible": true,
      "vedette": true,
      "images": [
        "img/photo-gravee-bois.jpg"
      ],
      "occasions": [
        "anniversaire",
        "noel",
        "fete-meres"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "tableau-scrabble",
      "nom": "Tableau famille façon Scrabble",
      "categorie": "gravure",
      "prix": 34.9,
      "image": "img/tableau-scrabble.jpg",
      "description": "Les prénoms de toute la famille croisés comme au Scrabble, gravés sur bois. Idéal pour papy, mamie ou la maison.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": true,
      "images": [
        "img/tableau-scrabble.jpg"
      ],
      "occasions": [
        "fete-peres",
        "fete-meres",
        "noel"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "panneau-directionnel",
      "nom": "Panneau directionnel famille",
      "categorie": "gravure",
      "prix": 34.9,
      "image": "img/panneau-directionnel.jpg",
      "description": "Flèches en bois gravées au nom de votre famille et de vos valeurs : Amour, Rires, Partage…",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/panneau-directionnel.jpg"
      ],
      "occasions": [
        "mariage",
        "noel"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "decapsuleur-mural",
      "nom": "Décapsuleur mural gravé",
      "categorie": "gravure",
      "prix": 29.9,
      "image": "img/decapsuleur-mural.jpg",
      "description": "Planche décapsuleur à fixer au mur, gravée avec votre texte. Le cadeau qui fait mouche pour les amateurs de bière.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/decapsuleur-mural.jpg"
      ],
      "occasions": [
        "fete-peres",
        "anniversaire",
        "noel"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "accroche-porte",
      "nom": "Accroche-porte gravé",
      "categorie": "gravure",
      "prix": 12.9,
      "image": "img/accroche-porte.jpg",
      "description": "Accroche-porte recto/verso (« Libre / Occupé », prénom de chambre…) gravé avec humour.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/accroche-porte.jpg"
      ],
      "occasions": [
        "anniversaire",
        "noel"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "dessous-de-verre",
      "nom": "Dessous de verre gravés",
      "categorie": "gravure",
      "prix": 6.9,
      "image": "img/dessous-de-verre.jpg",
      "description": "Dessous de verre en bois gravés de messages personnalisés. Prix à l'unité, tarif dégressif par lot.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/dessous-de-verre.jpg"
      ],
      "occasions": [
        "mariage",
        "remerciement",
        "pro"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "ardoise-gravee",
      "nom": "Ardoise gravée",
      "categorie": "gravure",
      "prix": 24.9,
      "image": "img/ardoise-gravee.jpg",
      "description": "Ardoise naturelle gravée d'un texte ou d'un dessin, avec support. Un souvenir élégant et durable.",
      "options": {
        "texte": true,
        "photo": true
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/ardoise-gravee.jpg"
      ],
      "occasions": [
        "fete-meres",
        "anniversaire"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "mug-personnalise",
      "nom": "Mug personnalisé",
      "categorie": "serigraphie",
      "prix": 14.9,
      "image": "img/mug-personnalise.jpg",
      "description": "Mug imprimé avec votre texte, votre photo ou un visuel créé pour vous : parrain, marraine, papy, maîtresse…",
      "options": {
        "texte": true,
        "photo": true
      },
      "visible": true,
      "vedette": true,
      "images": [
        "img/mug-personnalise.jpg"
      ],
      "occasions": [
        "fete-peres",
        "fete-meres",
        "remerciement",
        "noel",
        "pro"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "verre-imprime",
      "nom": "Verre imprimé",
      "categorie": "serigraphie",
      "prix": 12.9,
      "image": "img/verre-imprime.jpg",
      "description": "Grand verre imprimé : club de foot, prénom, animal, motif fleuri… Vous choisissez, on imprime.",
      "options": {
        "texte": true,
        "photo": true
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/verre-imprime.jpg"
      ],
      "occasions": [
        "anniversaire",
        "noel"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "plaque-voiture",
      "nom": "Plaque « À bord » pour voiture",
      "categorie": "serigraphie",
      "prix": 12.9,
      "image": "img/plaque-voiture.jpg",
      "description": "Plaque à ventouse pour la vitre arrière, version humoristique : infirmière, retraitée, nounou… ou entièrement personnalisée.",
      "options": {
        "texte": true,
        "photo": true
      },
      "visible": true,
      "vedette": true,
      "images": [
        "img/plaque-voiture.jpg"
      ],
      "occasions": [
        "retraite",
        "remerciement",
        "anniversaire"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "baskets-personnalisees",
      "nom": "Baskets personnalisées",
      "categorie": "serigraphie",
      "prix": 59.9,
      "image": "img/baskets-personnalisees.jpg",
      "description": "Baskets en toile personnalisées pour un mariage, un anniversaire ou juste pour vous. Indiquez votre pointure dans les précisions.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/baskets-personnalisees.jpg"
      ],
      "occasions": [
        "mariage",
        "anniversaire"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "prenom-vinyle",
      "nom": "Prénom en vinyle adhésif",
      "categorie": "serigraphie",
      "prix": 4.9,
      "image": "img/prenom-vinyle.jpg",
      "description": "Prénom découpé en vinyle à coller sur une gourde, un verre, une boîte… Plusieurs couleurs et finitions (paillettes, métallisé).",
      "options": {
        "texte": true,
        "photo": false
      },
      "variantes": {
        "nom": "Finition",
        "choix": [
          {
            "nom": "Uni",
            "prix": 0
          },
          {
            "nom": "Pailleté",
            "prix": 1
          },
          {
            "nom": "Métallisé",
            "prix": 1
          }
        ]
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/prenom-vinyle.jpg"
      ],
      "occasions": [
        "anniversaire",
        "noel"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "tirelire",
      "nom": "Tirelire personnalisée",
      "categorie": "serigraphie",
      "prix": 19.9,
      "image": "img/tirelire.jpg",
      "description": "Tirelire en céramique imprimée avec votre logo ou votre message : pour un pourboire de commerce ou une cagnotte.",
      "options": {
        "texte": true,
        "photo": true
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/tirelire.jpg"
      ],
      "occasions": [
        "pro",
        "retraite"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "plaque-naissance-bois",
      "nom": "Plaque de naissance en bois",
      "categorie": "evenements",
      "prix": 39.9,
      "image": "img/plaque-naissance-bois.jpg",
      "description": "Prénom en lettres de bois, illustration et petits cœurs avec la date, l'heure, le poids et la taille de bébé.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": true,
      "images": [
        "img/plaque-naissance-bois.jpg"
      ],
      "occasions": [
        "naissance"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "plaque-naissance-illustree",
      "nom": "Plaque de naissance illustrée",
      "categorie": "evenements",
      "prix": 29.9,
      "image": "img/plaque-naissance-illustree.jpg",
      "description": "Plaque imprimée sur socle en bois avec le prénom et les infos de naissance de bébé, illustration au choix.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/plaque-naissance-illustree.jpg"
      ],
      "occasions": [
        "naissance"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "panneau-bienvenue",
      "nom": "Panneau de bienvenue",
      "categorie": "evenements",
      "prix": 39.9,
      "image": "img/panneau-bienvenue.jpg",
      "description": "Grand panneau d'accueil pour baptême, mariage ou anniversaire, avec prénom, date et illustration.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/panneau-bienvenue.jpg"
      ],
      "occasions": [
        "naissance",
        "mariage"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "calendrier-date",
      "nom": "Calendrier « date à retenir »",
      "categorie": "evenements",
      "prix": 29.9,
      "image": "img/calendrier-date.jpg",
      "description": "Le mois de votre rencontre, mariage ou naissance avec la date entourée d'un cœur. Joli souvenir à poser.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/calendrier-date.jpg"
      ],
      "occasions": [
        "mariage",
        "naissance"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "cadre-mariage",
      "nom": "Cadre souvenir de mariage",
      "categorie": "evenements",
      "prix": 34.9,
      "image": "img/cadre-mariage.jpg",
      "description": "Cadre gravé avec mains entrelacées, prénoms des mariés et date, orné de fleurs séchées.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/cadre-mariage.jpg"
      ],
      "occasions": [
        "mariage"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "coeur-anniversaire-mariage",
      "nom": "Cœur anniversaire de mariage",
      "categorie": "evenements",
      "prix": 19.9,
      "image": "img/coeur-anniversaire-mariage.jpg",
      "description": "Cœur en bois gravé pour célébrer des noces d'or, d'argent… avec les prénoms et la date.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/coeur-anniversaire-mariage.jpg"
      ],
      "occasions": [
        "mariage"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "urne-mariage",
      "nom": "Urne personnalisée",
      "categorie": "evenements",
      "prix": 39.9,
      "image": "img/urne-mariage.jpg",
      "description": "Urne / boîte à enveloppes aux prénoms et au thème de votre fête : mariage, baptême, anniversaire.",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/urne-mariage.jpg"
      ],
      "occasions": [
        "mariage",
        "naissance"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "bracelet-jonc",
      "nom": "Bracelet jonc gravé",
      "categorie": "bijoux",
      "prix": 19.9,
      "image": "img/bracelet-jonc.jpg",
      "description": "Bracelet jonc gravé d'un prénom, d'une date ou d'un petit message, intérieur ou extérieur.",
      "options": {
        "texte": true,
        "photo": false
      },
      "variantes": {
        "nom": "Finition",
        "choix": [
          {
            "nom": "Doré",
            "prix": 0
          },
          {
            "nom": "Argenté",
            "prix": 0
          },
          {
            "nom": "Or rose",
            "prix": 0
          }
        ]
      },
      "visible": true,
      "vedette": true,
      "images": [
        "img/bracelet-jonc.jpg"
      ],
      "occasions": [
        "fete-meres",
        "anniversaire",
        "noel"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "bracelets-emailles",
      "nom": "Bracelets émaillés",
      "categorie": "bijoux",
      "prix": 9.9,
      "image": "img/bracelets-emailles.jpg",
      "description": "Bracelets jonc émaillés aux couleurs vives, à porter seuls ou en accumulation. Prix à l'unité.",
      "options": {
        "texte": false,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/bracelets-emailles.jpg"
      ],
      "occasions": [
        "anniversaire",
        "noel"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "boite-a-bijoux",
      "nom": "Boîte à bijoux personnalisée",
      "categorie": "bijoux",
      "prix": 19.9,
      "image": "img/boite-a-bijoux.jpg",
      "description": "Boîte à bijoux ronde avec compartiments, personnalisée sur le couvercle : « Princesse d'amour », « Mes premiers bijoux »…",
      "options": {
        "texte": true,
        "photo": false
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/boite-a-bijoux.jpg"
      ],
      "occasions": [
        "naissance",
        "anniversaire",
        "noel"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    },
    {
      "id": "porte-cles-grave",
      "nom": "Porte-clés gravé",
      "categorie": "bijoux",
      "prix": 9.9,
      "image": "img/porte-cles-grave.jpg",
      "description": "Porte-clés en bois gravé recto/verso : prénoms des petits-enfants, « Parrain de… », « Super papa »…",
      "options": {
        "texte": true,
        "photo": true
      },
      "visible": true,
      "vedette": false,
      "images": [
        "img/porte-cles-grave.jpg"
      ],
      "occasions": [
        "fete-peres",
        "noel",
        "remerciement"
      ],
      "badge": "",
      "prixBarre": 0,
      "delai": 0,
      "instructions": "",
      "dispo": "disponible"
    }
  ],
  "occasions": [
    {
      "id": "naissance",
      "nom": "Naissance & baptême"
    },
    {
      "id": "mariage",
      "nom": "Mariage"
    },
    {
      "id": "anniversaire",
      "nom": "Anniversaire"
    },
    {
      "id": "fete-meres",
      "nom": "Fête des mères"
    },
    {
      "id": "fete-peres",
      "nom": "Fête des pères & papys"
    },
    {
      "id": "noel",
      "nom": "Noël"
    },
    {
      "id": "remerciement",
      "nom": "Merci (maîtresse, nounou…)"
    },
    {
      "id": "retraite",
      "nom": "Départ & retraite"
    },
    {
      "id": "pro",
      "nom": "Entreprises & associations"
    }
  ],
  "avis": [],
  "faq": [
    {
      "q": "Comment se passe une commande personnalisée ?",
      "r": "Vous choisissez votre produit, indiquez votre texte et, si besoin, envoyez votre photo. Nous vous recontactons pour valider le rendu (avec une maquette si nécessaire) et le paiement avant de lancer la fabrication."
    },
    {
      "q": "Quel est le délai de fabrication ?",
      "r": "Il dépend de la pièce et de la période : il est indiqué sur la fiche produit quand il est connu, et nous vous le confirmons au moment de la validation. Pour une date précise (anniversaire, mariage…), indiquez-la dans votre commande."
    },
    {
      "q": "Puis-je retirer ma commande à la boutique ?",
      "r": "Oui, le retrait est gratuit à la boutique, 3 rue Salengro à Auchel, aux horaires d'ouverture. Nous vous prévenons dès que votre création est prête."
    },
    {
      "q": "Comment payer ?",
      "r": "Aucun paiement n'est demandé sur le site : nous vous indiquons les modalités de paiement au moment où nous validons votre commande avec vous."
    },
    {
      "q": "Puis-je envoyer ma propre photo ou mon logo ?",
      "r": "Bien sûr. Vous pouvez l'ajouter directement sur la fiche produit, ou nous l'envoyer après la commande. Une image nette et de bonne qualité donne le meilleur résultat."
    },
    {
      "q": "Faites-vous des commandes en quantité ?",
      "r": "Oui : mariages, associations, clubs, entreprises… Décrivez-nous votre projet dans le formulaire de devis, nous vous répondons rapidement avec un tarif adapté."
    },
    {
      "q": "Puis-je retourner un article personnalisé ?",
      "r": "Les articles personnalisés sont fabriqués spécialement pour vous : ils ne peuvent pas être échangés ni remboursés, sauf défaut. C'est pour cela que nous validons le rendu avec vous avant fabrication."
    }
  ]
};
