import { RenovationType } from "@/types";

export const renovationTypes: RenovationType[] = [
  // --- GROS ŒUVRE & STRUCTURE ---
  {
    id: "maconnerie",
    name: "Maçonnerie",
    description: "Travaux de maçonnerie générale, murs porteurs et rénovation structurelle",
    icon: "🧱",
    category: "Structure",
  },
  {
    id: "charpente",
    name: "Charpente",
    description: "Rénovation et traitement de charpentes en bois",
    icon: "🏗️",
    category: "Structure",
  },
  {
    id: "toiture",
    name: "Toiture & Ferblanterie",
    description: "Réparation de toits, tuiles, chenaux et étanchéité",
    icon: "🏠",
    category: "Structure",
  },
  {
    id: "demolition",
    name: "Démolition",
    description: "Démolition de cloisons, murs et évacuation de gravats",
    icon: "🔨",
    category: "Structure",
  },
  {
    id: "extension",
    name: "Extension",
    description: "Agrandissement de maison et annexes",
    icon: "🏗️",
    category: "Structure",
  },
  {
    id: "surelevation",
    name: "Surélévation",
    description: "Surélévation de toiture pour gagner un étage",
    icon: "⬆️",
    category: "Structure",
  },

  // --- SECOND ŒUVRE & TECHNIQUE ---
  {
    id: "electricite",
    name: "Électricité",
    description: "Installation, mise aux normes et tableaux électriques",
    icon: "⚡",
    category: "Technique",
  },
  {
    id: "plomberie",
    name: "Plomberie",
    description: "Réseaux d'eau, fuites et installations sanitaires",
    icon: "🚿",
    category: "Technique",
  },
  {
    id: "chauffage",
    name: "Chauffage",
    description: "Radiateurs, chaudières et chauffage au sol",
    icon: "🌡️",
    category: "Technique",
  },
  {
    id: "ventilation",
    name: "Ventilation & VMC",
    description: "Systèmes d'aération et qualité de l'air",
    icon: "💨",
    category: "Technique",
  },
  {
    id: "climatisation",
    name: "Climatisation",
    description: "Installation de climatiseurs fixes et réversibles",
    icon: "❄️",
    category: "Technique",
  },
  {
    id: "adoucisseur",
    name: "Adoucisseur d'eau",
    description: "Installation et entretien de systèmes anti-calcaire",
    icon: "💧",
    category: "Technique",
  },

  // --- ÉNERGIE & DURABILITÉ (Important pour la Suisse) ---
  {
    id: "panneaux_solaires",
    name: "Panneaux Solaires",
    description: "Installation photovoltaïque et thermique",
    icon: "☀️",
    category: "Énergie",
  },
  {
    id: "pompe_a_chaleur",
    name: "Pompe à chaleur (PAC)",
    description: "Installation de PAC air-eau, géothermie ou air-air",
    icon: "🔋",
    category: "Énergie",
  },
  {
    id: "isolation",
    name: "Isolation",
    description: "Isolation thermique (ITH/ITE) et phonique",
    icon: "🛡️",
    category: "Énergie",
  },
  {
    id: "borne_recharge",
    name: "Borne de recharge",
    description: "Installation de bornes pour véhicules électriques",
    icon: "🚗",
    category: "Énergie",
  },
  {
    id: "audit_energetique",
    name: "Audit Énergétique",
    description: "Analyse CECB et conseils pour subventions",
    icon: "📊",
    category: "Conseil",
  },

  // --- MENUISERIE & OUVERTURES ---
  {
    id: "menuiserie",
    name: "Menuiserie générale",
    description: "Travaux sur mesure, plinthes et finitions bois",
    icon: "🪵",
    category: "Menuiserie",
  },
  {
    id: "fenetre",
    name: "Fenêtres & Vitrerie",
    description: "Pose de fenêtres (PVC, Bois, Alu) et remplacement de vitres",
    icon: "🪟",
    category: "Menuiserie",
  },
  {
    id: "stores_volets",
    name: "Stores & Volets",
    description: "Installation et réparation de stores, volets roulants et battants",
    icon: "🌗",
    category: "Menuiserie",
  },
  {
    id: "porte",
    name: "Portes",
    description: "Portes d'entrée, intérieures et blindées",
    icon: "🚪",
    category: "Menuiserie",
  },
  {
    id: "escalier",
    name: "Escaliers",
    description: "Création, rénovation ou habillage d'escaliers",
    icon: "🪜",
    category: "Menuiserie",
  },

  // --- FINITIONS & DÉCORATION ---
  {
    id: "peinture",
    name: "Peinture",
    description: "Peinture murs, plafonds et boiseries (intérieur/extérieur)",
    icon: "🎨",
    category: "Finition",
  },
  {
    id: "papier_peint",
    name: "Papier Peint & Déco",
    description: "Pose de papiers peints, tapisseries et enduits décoratifs",
    icon: "🖼️",
    category: "Finition",
  },
  {
    id: "carrelage",
    name: "Carrelage & Faïence",
    description: "Pose de carrelage sol et mural, mosaïque",
    icon: "🔲",
    category: "Finition",
  },
  {
    id: "parquet",
    name: "Parquet",
    description: "Pose, ponçage et vitrification de parquets",
    icon: "🪵",
    category: "Finition",
  },
  {
    id: "sols_souples",
    name: "Sols Souples",
    description: "Lino, vinyle, moquette et PVC",
    icon: "🧶",
    category: "Finition",
  },
  {
    id: "beton_cire",
    name: "Béton Ciré",
    description: "Application de béton ciré sur sols et murs",
    icon: "🌫️",
    category: "Finition",
  },
  {
    id: "cloisons",
    name: "Plâtrerie & Cloisons",
    description: "Faux-plafonds, cloisons sèches et lissage",
    icon: "🧱",
    category: "Finition",
  },

  // --- PIÈCES SPÉCIFIQUES ---
  {
    id: "salle_de_bain",
    name: "Salle de bain",
    description: "Rénovation clé en main, douches italiennes",
    icon: "🛁",
    category: "Pièce",
  },
  {
    id: "cuisine",
    name: "Cuisine",
    description: "Pose de cuisine équipée et rénovation",
    icon: "🍽️",
    category: "Pièce",
  },
  {
    id: "combles",
    name: "Combles & Grenier",
    description: "Aménagement et isolation de combles habitables",
    icon: "🏠",
    category: "Pièce",
  },
  {
    id: "cave",
    name: "Cave & Sous-sol",
    description: "Assainissement et aménagement de sous-sols",
    icon: "🔦",
    category: "Pièce",
  },
  {
    id: "bureau",
    name: "Bureau / Télétravail",
    description: "Création d'espaces de travail optimisés",
    icon: "💻",
    category: "Pièce",
  },

  // --- EXTÉRIEUR & JARDIN ---
  {
    id: "jardin",
    name: "Paysagisme",
    description: "Création de jardins, pelouses et plantations",
    icon: "🌳",
    category: "Extérieur",
  },
  {
    id: "terrasse",
    name: "Terrasse",
    description: "Construction de terrasses bois, composite ou dalles",
    icon: "☀️",
    category: "Extérieur",
  },
  {
    id: "clotture",
    name: "Clôtures & Portails",
    description: "Installation de délimitations et portails automatiques",
    icon: "🚧",
    category: "Extérieur",
  },
  {
    id: "piscine",
    name: "Piscine & Spa",
    description: "Construction et rénovation de piscines",
    icon: "🏊",
    category: "Extérieur",
  },
  {
    id: "pavage",
    name: "Pavage & Dallage",
    description: "Allées de garage, cours et chemins d'accès",
    icon: "🧱",
    category: "Extérieur",
  },
  {
    id: "veranda",
    name: "Véranda & Pergola",
    description: "Extensions vitrées et protections solaires extérieures",
    icon: "🌿",
    category: "Extérieur",
  },
  {
    id: "ravalement",
    name: "Façade",
    description: "Nettoyage, crépi et rénovation de façades",
    icon: "🏠",
    category: "Extérieur",
  },

  // --- SÉCURITÉ & ACCESSIBILITÉ ---
  {
    id: "securite",
    name: "Systèmes de Sécurité",
    description: "Alarmes, vidéosurveillance et contrôle d'accès",
    icon: "📹",
    category: "Sécurité",
  },
  {
    id: "serrurerie",
    name: "Serrurerie",
    description: "Changement de serrures, blindage et dépannage",
    icon: "🔑",
    category: "Sécurité",
  },
  {
    id: "pmr",
    name: "Accessibilité PMR",
    description: "Adaptation du logement pour mobilité réduite (rampes, douches)",
    icon: "♿",
    category: "Accessibilité",
  },

  // --- AGENCEMENT & RANGEMENT ---
  {
    id: "dressing",
    name: "Dressing & Placards",
    description: "Rangements sur mesure et penderies",
    icon: "👔",
    category: "Agencement",
  },
  {
    id: "bibliotheque",
    name: "Bibliothèque",
    description: "Meubles TV et bibliothèques sur mesure",
    icon: "📚",
    category: "Agencement",
  },
  {
    id: "amenagement_interieur",
    name: "Agencement Intérieur",
    description: "Optimisation de l'espace et cloisons amovibles",
    icon: "📐",
    category: "Agencement",
  },

  // --- SERVICES & PETITS TRAVAUX ---
  {
    id: "bricolage",
    name: "Homme à tout faire",
    description: "Petits travaux: montage meubles, fixation cadres, réparations",
    icon: "🛠️",
    category: "Service",
  },
  {
    id: "nettoyage",
    name: "Nettoyage Fin de Chantier",
    description: "Remise en état après travaux",
    icon: "🧹",
    category: "Service",
  },
  {
    id: "demenagement",
    name: "Aide au Déménagement",
    description: "Manutention et transport pour vos projets",
    icon: "📦",
    category: "Service",
  },
  {
    id: "home_staging",
    name: "Home Staging",
    description: "Valorisation immobilière pour la vente",
    icon: "✨",
    category: "Conseil",
  },
  {
    id: "architecte",
    name: "Architecte / Ingénieur",
    description: "Plans, demandes de permis et direction de travaux",
    icon: "📝",
    category: "Conseil",
  },
  {
    id: "design_interieur",
    name: "Décorateur d'intérieur",
    description: "Conseil en ambiance, couleurs et mobilier",
    icon: "🎨",
    category: "Conseil",
  },

  // --- TRAITEMENTS SPÉCIFIQUES ---
  {
    id: "desamiantage",
    name: "Désamiantage",
    description: "Retrait sécurisé de matériaux contenant de l'amiante",
    icon: "⚠️",
    category: "Traitement",
  },
  {
    id: "humidite",
    name: "Traitement Humidité",
    description: "Injections, assèchement et traitement des moisissures",
    icon: "💧",
    category: "Traitement",
  },
  {
    id: "nuisibles",
    name: "Gestion Nuisibles",
    description: "Traitement de charpentes et dératisation",
    icon: "🐜",
    category: "Traitement",
  },

  // --- LUXE & LOISIRS ---
  {
    id: "cave_vin",
    name: "Cave à vin",
    description: "Aménagement de caves climatisées sur mesure",
    icon: "🍷",
    category: "Luxe",
  },
  {
    id: "home_cinema",
    name: "Home Cinéma",
    description: "Salles dédiées et acoustique",
    icon: "🎬",
    category: "Luxe",
  },
  {
    id: "domotique",
    name: "Domotique (Smart Home)",
    description: "Maison connectée : éclairage, chauffage, volets",
    icon: "📱",
    category: "Technologie",
  },
];

// Fonctions utilitaires inchangées ou optimisées

export const findRenovationTypeByName = (name: string): RenovationType | undefined => {
  const search = name.toLowerCase();
  return renovationTypes.find(
    (type) => type.name.toLowerCase().includes(search) || type.description.toLowerCase().includes(search),
  );
};

export const findRenovationTypeById = (id: string): RenovationType | undefined => {
  return renovationTypes.find((type) => type.id === id);
};

export const getRenovationCategories = (): string[] => {
  return [...new Set(renovationTypes.map((type) => type.category))].sort();
};

export const getRenovationsByCategory = (category: string): RenovationType[] => {
  return renovationTypes.filter((type) => type.category === category);
};
