// ============================================================
//  CONFIGURATION DU SITE — à modifier en priorité
// ============================================================
window.SITE = {
  nom: "Mon Truc en Bois",
  slogan: "Personnalisation, sérigraphie, gravure texte & photo, bijoux",
  telephone: "07 83 39 40 28",
  // ⚠️ À REMPLACER par la vraie adresse email (elle reçoit les commandes et devis).
  email: "contact@montrucenbois.fr",
  adresse: "3 rue Salengro, 62260 Auchel",
  horaires: [
    "Lundi : fermé",
    "Mardi : 9h – 11h30 / 13h30 – 18h",
    "Mercredi : fermé",
    "Jeudi : 9h – 11h30 / 13h30 – 19h",
    "Vendredi : 9h – 11h30 / 13h30 – 19h",
    "Samedi : 10h – 19h",
    "Dimanche : 10h – 13h",
  ],
  facebook: "https://www.facebook.com/profile.php?id=100094575102607",
  avis: "Recommandé à 100 % (16 avis Facebook)",

  // Adresse d'envoi des commandes.
  // Laisser vide pour envoyer les commandes par email (mailto).
  // Ou créer un formulaire gratuit sur https://formspree.io et coller l'URL ici,
  // ex. "https://formspree.io/f/abcdwxyz" : les commandes arriveront alors directement
  // dans la boîte mail, sans que le client ait à ouvrir sa messagerie.
  formulaireCommande: "",

  // Frais de livraison (en euros) et seuil de gratuité.
  livraison: 5.9,
  livraisonOfferteDes: 60,
};
