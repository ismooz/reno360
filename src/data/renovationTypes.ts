
import { RenovationType } from '@/types';

export const renovationTypes: RenovationType[] = [
  // Services de base
  {
    id: 'peinture',
    name: 'Peinture',
    description: 'Services de peinture intérieure et extérieure pour tous types de bâtiments',
    icon: '🎨',
    category: 'Finition'
  },
  {
    id: 'plomberie',
    name: 'Plomberie',
    description: 'Installation et réparation de systèmes de plomberie pour cuisines et salles de bains',
    icon: '🚿',
    category: 'Technique'
  },
  {
    id: 'electricite',
    name: 'Électricité',
    description: 'Services d\'installation électrique et de mise aux normes',
    icon: '⚡',
    category: 'Technique'
  },
  {
    id: 'chauffage',
    name: 'Chauffage',
    description: 'Installation et réparation de systèmes de chauffage',
    icon: '🌡️',
    category: 'Technique'
  },
  {
    id: 'isolation',
    name: 'Isolation',
    description: 'Services d\'isolation thermique et acoustique',
    icon: '🛡️',
    category: 'Rénovation énergétique'
  },
  {
    id: 'menuiserie',
    name: 'Menuiserie',
    description: 'Rénovation de portes, fenêtres et autres éléments en bois',
    icon: '🔨',
    category: 'Structure'
  },
  {
    id: 'carrelage',
    name: 'Carrelage',
    description: 'Installation et rénovation de carrelage et revêtements de sol',
    icon: '🔲',
    category: 'Finition'
  },
  {
    id: 'maconnerie',
    name: 'Maçonnerie',
    description: 'Travaux de maçonnerie générale et de rénovation',
    icon: '🧱',
    category: 'Structure'
  },
  {
    id: 'toiture',
    name: 'Toiture',
    description: 'Réparation et rénovation de toitures',
    icon: '🏠',
    category: 'Structure'
  },
  {
    id: 'amenagement',
    name: 'Aménagement',
    description: 'Aménagement intérieur et extérieur',
    icon: '📐',
    category: 'Design'
  },
  {
    id: 'salle_de_bain',
    name: 'Salle de bain',
    description: 'Rénovation complète de salle de bain',
    icon: '🛁',
    category: 'Pièce'
  },
  {
    id: 'cuisine',
    name: 'Cuisine',
    description: 'Rénovation et installation de cuisines',
    icon: '🍽️',
    category: 'Pièce'
  },
  {
    id: 'ventilation',
    name: 'Ventilation',
    description: 'Installation et maintenance de systèmes de ventilation',
    icon: '💨',
    category: 'Technique'
  },
  {
    id: 'domotique',
    name: 'Domotique',
    description: 'Installation de systèmes domotiques pour maisons intelligentes',
    icon: '📱',
    category: 'Technologie'
  },
  {
    id: 'jardin',
    name: 'Aménagement extérieur',
    description: 'Aménagement de jardin et espaces extérieurs',
    icon: '🌳',
    category: 'Extérieur'
  },
  {
    id: 'piscine',
    name: 'Piscine',
    description: 'Installation et rénovation de piscines',
    icon: '🏊',
    category: 'Extérieur'
  },
  {
    id: 'cloisons',
    name: 'Cloisons & Plâtrerie',
    description: 'Installation de cloisons et travaux de plâtrerie',
    icon: '🧱',
    category: 'Structure'
  },
  {
    id: 'sols',
    name: 'Revêtements de sols',
    description: 'Installation de parquets, stratifiés et autres revêtements de sols',
    icon: '🪵',
    category: 'Finition'
  },
  {
    id: 'renovation_complete',
    name: 'Rénovation complète',
    description: 'Services de rénovation complète de propriétés',
    icon: '🏗️',
    category: 'Projet global'
  },
  {
    id: 'architecte',
    name: 'Services d\'architecte',
    description: 'Conception, plans et supervision de projets de rénovation',
    icon: '📝',
    category: 'Conseil'
  },
  
  // Nouveaux services étoffés
  {
    id: 'parquet',
    name: 'Parquet',
    description: 'Pose et rénovation de parquets massifs, contrecollés et stratifiés',
    icon: '🪵',
    category: 'Finition'
  },
  {
    id: 'climatisation',
    name: 'Climatisation',
    description: 'Installation et maintenance de systèmes de climatisation',
    icon: '❄️',
    category: 'Technique'
  },
  {
    id: 'fenetre',
    name: 'Fenêtres',
    description: 'Remplacement et installation de fenêtres PVC, alu ou bois',
    icon: '🪟',
    category: 'Structure'
  },
  {
    id: 'porte',
    name: 'Portes',
    description: 'Installation de portes intérieures et extérieures',
    icon: '🚪',
    category: 'Structure'
  },
  {
    id: 'escalier',
    name: 'Escaliers',
    description: 'Création et rénovation d\'escaliers en bois, métal ou béton',
    icon: '🪜',
    category: 'Structure'
  },
  {
    id: 'placard',
    name: 'Placards & Dressing',
    description: 'Aménagement de placards sur mesure et dressings',
    icon: '🗄️',
    category: 'Rangement'
  },
  {
    id: 'bibliotheque',
    name: 'Bibliothèques',
    description: 'Création de bibliothèques et étagères sur mesure',
    icon: '📚',
    category: 'Rangement'
  },
  {
    id: 'mezzanine',
    name: 'Mezzanine',
    description: 'Création de mezzanines pour optimiser l\'espace',
    icon: '🏢',
    category: 'Structure'
  },
  {
    id: 'veranda',
    name: 'Véranda',
    description: 'Construction et rénovation de vérandas',
    icon: '🌿',
    category: 'Extérieur'
  },
  {
    id: 'pergola',
    name: 'Pergola',
    description: 'Installation de pergolas et structures extérieures',
    icon: '🌳',
    category: 'Extérieur'
  },
  {
    id: 'terrasse',
    name: 'Terrasse',
    description: 'Création et rénovation de terrasses en bois, composite ou carrelage',
    icon: '☀️',
    category: 'Extérieur'
  },
  {
    id: 'clotture',
    name: 'Clôture',
    description: 'Installation de clôtures et portails',
    icon: '🚧',
    category: 'Extérieur'
  },
  {
    id: 'garage',
    name: 'Garage',
    description: 'Aménagement et rénovation de garages',
    icon: '🚗',
    category: 'Utilitaire'
  },
  {
    id: 'cave',
    name: 'Cave & Sous-sol',
    description: 'Aménagement de caves et sous-sols',
    icon: '🏠',
    category: 'Utilitaire'
  },
  {
    id: 'combles',
    name: 'Combles',
    description: 'Aménagement de combles et greniers',
    icon: '🏠',
    category: 'Espace'
  },
  {
    id: 'extension',
    name: 'Extension',
    description: 'Extension de maison et agrandissement',
    icon: '🏗️',
    category: 'Structure'
  },
  {
    id: 'surélévation',
    name: 'Surélévation',
    description: 'Surélévation de maison pour gagner de l\'espace',
    icon: '⬆️',
    category: 'Structure'
  },
  {
    id: 'ravalement',
    name: 'Ravalement',
    description: 'Ravalement de façade et nettoyage extérieur',
    icon: '🧽',
    category: 'Extérieur'
  },
  {
    id: 'nettoyage',
    name: 'Nettoyage',
    description: 'Nettoyage après travaux et entretien',
    icon: '🧹',
    category: 'Service'
  },
  {
    id: 'demenagement',
    name: 'Déménagement',
    description: 'Services de déménagement pour vos travaux',
    icon: '🚚',
    category: 'Service'
  },
  {
    id: 'design_interieur',
    name: 'Design d\'intérieur',
    description: 'Conseil en décoration et aménagement d\'intérieur',
    icon: '🎨',
    category: 'Conseil'
  },
  {
    id: 'bureau',
    name: 'Bureau',
    description: 'Aménagement d\'espaces de travail et bureaux',
    icon: '💻',
    category: 'Pièce'
  },
  {
    id: 'chambre',
    name: 'Chambre',
    description: 'Rénovation et aménagement de chambres',
    icon: '🛏️',
    category: 'Pièce'
  },
  {
    id: 'salon',
    name: 'Salon',
    description: 'Rénovation et aménagement de salons',
    icon: '🛋️',
    category: 'Pièce'
  },
  {
    id: 'salle_a_manger',
    name: 'Salle à manger',
    description: 'Aménagement de salles à manger',
    icon: '🍽️',
    category: 'Pièce'
  },
  {
    id: 'entree',
    name: 'Entrée',
    description: 'Aménagement d\'entrées et halls',
    icon: '🚪',
    category: 'Pièce'
  },
  {
    id: 'couloir',
    name: 'Couloir',
    description: 'Optimisation et décoration de couloirs',
    icon: '➡️',
    category: 'Pièce'
  },
  {
    id: 'buanderie',
    name: 'Buanderie',
    description: 'Aménagement de buanderies et espaces techniques',
    icon: '👕',
    category: 'Utilitaire'
  },
  {
    id: 'cellier',
    name: 'Cellier',
    description: 'Aménagement de celliers et garde-manger',
    icon: '📦',
    category: 'Utilitaire'
  },
  {
    id: 'spa',
    name: 'Spa & Wellness',
    description: 'Création d\'espaces spa et bien-être',
    icon: '🧘',
    category: 'Luxe'
  },
  {
    id: 'home_cinema',
    name: 'Home cinéma',
    description: 'Aménagement de salles de cinéma privées',
    icon: '🎬',
    category: 'Luxe'
  },
  {
    id: 'cave_vin',
    name: 'Cave à vin',
    description: 'Création de caves à vin climatisées',
    icon: '🍷',
    category: 'Luxe'
  },
  {
    id: 'salle_sport',
    name: 'Salle de sport',
    description: 'Aménagement de salles de sport privées',
    icon: '🏋️',
    category: 'Luxe'
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Aménagement de studios et espaces multifonctions',
    icon: '🏠',
    category: 'Pièce'
  },
  {
    id: 'loft',
    name: 'Loft',
    description: 'Rénovation et aménagement de lofts',
    icon: '🏢',
    category: 'Pièce'
  },
  {
    id: 'duplex',
    name: 'Duplex',
    description: 'Aménagement de duplex et triplex',
    icon: '🏘️',
    category: 'Pièce'
  }
];

export const findRenovationTypeByName = (name: string): RenovationType | undefined => {
  return renovationTypes.find(type => 
    type.name.toLowerCase().includes(name.toLowerCase()) || 
    type.description.toLowerCase().includes(name.toLowerCase())
  );
};

export const findRenovationTypeById = (id: string): RenovationType | undefined => {
  return renovationTypes.find(type => type.id === id);
};

export const getRenovationCategories = (): string[] => {
  return [...new Set(renovationTypes.map(type => type.category))].sort();
};

export const getRenovationsByCategory = (category: string): RenovationType[] => {
  return renovationTypes.filter(type => type.category === category);
};
