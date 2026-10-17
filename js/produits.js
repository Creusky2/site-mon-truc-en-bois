// ============================================================
//  CATALOGUE — ajouter, retirer ou modifier les produits ici.
//  image : chemin d'une photo dans /img (ex. "img/planche.jpg").
//          Laisser vide pour afficher une illustration automatique.
//  options.texte : le client peut saisir un texte à graver/imprimer
//  options.photo : le client peut envoyer une photo
//  variantes : choix proposés (taille, couleur, matière…) avec supplément éventuel
// ============================================================
window.CATEGORIES = {
  gravure: { nom: "Gravure", icone: "✒️", description: "Bois, verre, ardoise, métal : vos textes et dessins gravés au laser." },
  serigraphie: { nom: "Sérigraphie & textile", icone: "👕", description: "T-shirts, sweats, tote bags imprimés à votre image." },
  photo: { nom: "Photo personnalisée", icone: "🖼️", description: "Vos plus belles photos sur bois, verre ou toile." },
  bijoux: { nom: "Bijoux", icone: "💍", description: "Pendentifs, bracelets et porte-clés gravés, uniques comme vous." },
};

window.PRODUITS = [
  {
    id: "planche-decouper",
    nom: "Planche à découper gravée",
    categorie: "gravure",
    prix: 29.9,
    image: "",
    description: "Planche en bois massif gravée avec le texte de votre choix : prénoms, date, recette de famille… Un cadeau utile et plein de sens.",
    options: { texte: true, photo: false },
    variantes: { nom: "Taille", choix: [{ nom: "30 × 20 cm", prix: 0 }, { nom: "40 × 25 cm", prix: 8 }] },
  },
  {
    id: "ardoise-gravee",
    nom: "Ardoise gravée",
    categorie: "gravure",
    prix: 24.9,
    image: "",
    description: "Ardoise naturelle gravée : idéale comme plaque de maison, dessous de plat ou souvenir de mariage.",
    options: { texte: true, photo: true },
    variantes: { nom: "Forme", choix: [{ nom: "Rectangle", prix: 0 }, { nom: "Ronde", prix: 2 }, { nom: "Cœur", prix: 4 }] },
  },
  {
    id: "verre-grave",
    nom: "Verre / flûte gravé(e)",
    categorie: "gravure",
    prix: 14.9,
    image: "",
    description: "Verre à vin, flûte à champagne ou chope gravés : parfait pour les mariages, anniversaires et EVJF.",
    options: { texte: true, photo: false },
    variantes: { nom: "Modèle", choix: [{ nom: "Verre à vin", prix: 0 }, { nom: "Flûte", prix: 0 }, { nom: "Chope à bière", prix: 4 }] },
  },
  {
    id: "tshirt-perso",
    nom: "T-shirt personnalisé",
    categorie: "serigraphie",
    prix: 19.9,
    image: "",
    description: "T-shirt coton imprimé avec votre texte, logo ou photo. Idéal pour les associations, événements et entreprises (tarifs dégressifs sur devis).",
    options: { texte: true, photo: true },
    variantes: { nom: "Taille", choix: ["XS", "S", "M", "L", "XL", "XXL"].map((t) => ({ nom: t, prix: 0 })) },
  },
  {
    id: "sweat-perso",
    nom: "Sweat à capuche personnalisé",
    categorie: "serigraphie",
    prix: 39.9,
    image: "",
    description: "Sweat chaud et confortable, personnalisé devant et/ou dos.",
    options: { texte: true, photo: true },
    variantes: { nom: "Taille", choix: ["S", "M", "L", "XL", "XXL"].map((t) => ({ nom: t, prix: 0 })) },
  },
  {
    id: "tote-bag",
    nom: "Tote bag personnalisé",
    categorie: "serigraphie",
    prix: 14.9,
    image: "",
    description: "Sac en toile de coton résistant, imprimé à votre goût.",
    options: { texte: true, photo: true },
  },
  {
    id: "photo-bois",
    nom: "Photo sur bois",
    categorie: "photo",
    prix: 34.9,
    image: "",
    description: "Votre photo imprimée ou gravée sur une plaque de bois, avec un rendu chaleureux et authentique. Livrée avec support.",
    options: { texte: true, photo: true },
    variantes: { nom: "Format", choix: [{ nom: "15 × 20 cm", prix: 0 }, { nom: "20 × 30 cm", prix: 10 }, { nom: "30 × 40 cm", prix: 20 }] },
  },
  {
    id: "photo-verre",
    nom: "Photo sur verre",
    categorie: "photo",
    prix: 39.9,
    image: "",
    description: "Photo imprimée sur verre, avec un rendu brillant et lumineux. Un cadeau souvenir élégant.",
    options: { texte: true, photo: true },
    variantes: { nom: "Format", choix: [{ nom: "15 × 20 cm", prix: 0 }, { nom: "20 × 30 cm", prix: 12 }] },
  },
  {
    id: "pendentif-grave",
    nom: "Pendentif gravé",
    categorie: "bijoux",
    prix: 24.9,
    image: "",
    description: "Pendentif en acier inoxydable gravé d'un prénom, d'une date ou d'une photo. Chaîne incluse.",
    options: { texte: true, photo: true },
    variantes: { nom: "Finition", choix: [{ nom: "Argenté", prix: 0 }, { nom: "Doré", prix: 3 }, { nom: "Or rose", prix: 3 }] },
  },
  {
    id: "bracelet-grave",
    nom: "Bracelet gravé",
    categorie: "bijoux",
    prix: 19.9,
    image: "",
    description: "Bracelet jonc ou cordon avec plaque gravée de votre message.",
    options: { texte: true, photo: false },
    variantes: { nom: "Modèle", choix: [{ nom: "Jonc", prix: 0 }, { nom: "Cordon", prix: 0 }] },
  },
  {
    id: "porte-cles",
    nom: "Porte-clés gravé",
    categorie: "bijoux",
    prix: 9.9,
    image: "",
    description: "Porte-clés en bois ou en métal, gravé recto/verso.",
    options: { texte: true, photo: true },
    variantes: { nom: "Matière", choix: [{ nom: "Bois", prix: 0 }, { nom: "Métal", prix: 3 }] },
  },
];

window.trouverProduit = (id) => window.PRODUITS.find((p) => p.id === id);
