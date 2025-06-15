
import { RenovationType } from '@/types';

export const renovationTypes: RenovationType[] = [
  // Services de base
  {
    id: 'peinture',
    name: 'Peinture',
    description: 'Services de peinture intérieure et extérieure pour tous types de bâtiments',
    icon: 'PaintBucket',
    category: 'Finition'
  },
  {
    id: 'plomberie',
    name: 'Plomberie',
    description: 'Installation et réparation de systèmes de plomberie pour cuisines et salles de bains',
    icon: 'Droplets',
    category: 'Technique'
  },
  {
    id: 'electricite',
    name: 'Électricité',
    description: 'Services d\'installation électrique et de mise aux normes',
    icon: 'Zap',
    category: 'Technique'
  },
  {
    id: 'chauffage',
    name: 'Chauffage',
    description: 'Installation et réparation de systèmes de chauffage',
    icon: 'Thermometer',
    category: 'Technique'
  },
  {
    id: 'isolation',
    name: 'Isolation',
    description: 'Services d\'isolation thermique et acoustique',
    icon: 'Shield',
    category: 'Rénovation énergétique'
  },
  {
    id: 'menuiserie',
    name: 'Menuiserie',
    description: 'Rénovation de portes, fenêtres et autres éléments en bois',
    icon: 'Construction',
    category: 'Structure'
  },
  {
    id: 'carrelage',
    name: 'Carrelage',
    description: 'Installation et rénovation de carrelage et revêtements de sol',
    icon: 'Grid',
    category: 'Finition'
  },
  {
    id: 'maconnerie',
    name: 'Maçonnerie',
    description: 'Travaux de maçonnerie générale et de rénovation',
    icon: 'Bricks',
    category: 'Structure'
  },
  {
    id: 'toiture',
    name: 'Toiture',
    description: 'Réparation et rénovation de toitures',
    icon: 'Home',
    category: 'Structure'
  },
  {
    id: 'amenagement',
    name: 'Aménagement',
    description: 'Aménagement intérieur et extérieur',
    icon: 'LayoutDashboard',
    category: 'Design'
  },
  {
    id: 'salle_de_bain',
    name: 'Salle de bain',
    description: 'Rénovation complète de salle de bain',
    icon: 'Shower',
    category: 'Pièce'
  },
  {
    id: 'cuisine',
    name: 'Cuisine',
    description: 'Rénovation et installation de cuisines',
    icon: 'Utensils',
    category: 'Pièce'
  },
  {
    id: 'ventilation',
    name: 'Ventilation',
    description: 'Installation et maintenance de systèmes de ventilation',
    icon: 'Wind',
    category: 'Technique'
  },
  {
    id: 'domotique',
    name: 'Domotique',
    description: 'Installation de systèmes domotiques pour maisons intelligentes',
    icon: 'Smartphone',
    category: 'Technologie'
  },
  {
    id: 'jardin',
    name: 'Aménagement extérieur',
    description: 'Aménagement de jardin et espaces extérieurs',
    icon: 'Tree',
    category: 'Extérieur'
  },
  {
    id: 'piscine',
    name: 'Piscine',
    description: 'Installation et rénovation de piscines',
    icon: 'Waves',
    category: 'Extérieur'
  },
  {
    id: 'cloisons',
    name: 'Cloisons & Plâtrerie',
    description: 'Installation de cloisons et travaux de plâtrerie',
    icon: 'Separator',
    category: 'Structure'
  },
  {
    id: 'sols',
    name: 'Revêtements de sols',
    description: 'Installation de parquets, stratifiés et autres revêtements de sols',
    icon: 'Square',
    category: 'Finition'
  },
  {
    id: 'renovation_complete',
    name: 'Rénovation complète',
    description: 'Services de rénovation complète de propriétés',
    icon: 'Home',
    category: 'Projet global'
  },
  {
    id: 'architecte',
    name: 'Services d\'architecte',
    description: 'Conception, plans et supervision de projets de rénovation',
    icon: 'Pencil',
    category: 'Conseil'
  },
  
  // Nouveaux services étoffés
  {
    id: 'parquet',
    name: 'Parquet',
    description: 'Pose et rénovation de parquets massifs, contrecollés et stratifiés',
    icon: 'Square',
    category: 'Finition'
  },
  {
    id: 'climatisation',
    name: 'Climatisation',
    description: 'Installation et maintenance de systèmes de climatisation',
    icon: 'Snowflake',
    category: 'Technique'
  },
  {
    id: 'fenetre',
    name: 'Fenêtres',
    description: 'Remplacement et installation de fenêtres PVC, alu ou bois',
    icon: 'Frame',
    category: 'Structure'
  },
  {
    id: 'porte',
    name: 'Portes',
    description: 'Installation de portes intérieures et extérieures',
    icon: 'Door',
    category: 'Structure'
  },
  {
    id: 'escalier',
    name: 'Escaliers',
    description: 'Création et rénovation d\'escaliers en bois, métal ou béton',
    icon: 'ChevronUp',
    category: 'Structure'
  },
  {
    id: 'placard',
    name: 'Placards & Dressing',
    description: 'Aménagement de placards sur mesure et dressings',
    icon: 'Cabinet',
    category: 'Rangement'
  },
  {
    id: 'bibliotheque',
    name: 'Bibliothèques',
    description: 'Création de bibliothèques et étagères sur mesure',
    icon: 'BookOpen',
    category: 'Rangement'
  },
  {
    id: 'mezzanine',
    name: 'Mezzanine',
    description: 'Création de mezzanines pour optimiser l\'espace',
    icon: 'Building2',
    category: 'Structure'
  },
  {
    id: 'veranda',
    name: 'Véranda',
    description: 'Construction et rénovation de vérandas',
    icon: 'Greenhouse',
    category: 'Extérieur'
  },
  {
    id: 'pergola',
    name: 'Pergola',
    description: 'Installation de pergolas et structures extérieures',
    icon: 'Trees',
    category: 'Extérieur'
  },
  {
    id: 'terrasse',
    name: 'Terrasse',
    description: 'Création et rénovation de terrasses en bois, composite ou carrelage',
    icon: 'Sun',
    category: 'Extérieur'
  },
  {
    id: 'clotture',
    name: 'Clôture',
    description: 'Installation de clôtures et portails',
    icon: 'Fence',
    category: 'Extérieur'
  },
  {
    id: 'garage',
    name: 'Garage',
    description: 'Aménagement et rénovation de garages',
    icon: 'Car',
    category: 'Utilitaire'
  },
  {
    id: 'cave',
    name: 'Cave & Sous-sol',
    description: 'Aménagement de caves et sous-sols',
    icon: 'Basement',
    category: 'Utilitaire'
  },
  {
    id: 'combles',
    name: 'Combles',
    description: 'Aménagement de combles et greniers',
    icon: 'Roof',
    category: 'Espace'
  },
  {
    id: 'extension',
    name: 'Extension',
    description: 'Extension de maison et agrandissement',
    icon: 'Expand',
    category: 'Structure'
  },
  {
    id: 'surélévation',
    name: 'Surélévation',
    description: 'Surélévation de maison pour gagner de l\'espace',
    icon: 'ArrowUp',
    category: 'Structure'
  },
  {
    id: 'ravalement',
    name: 'Ravalement',
    description: 'Ravalement de façade et nettoyage extérieur',
    icon: 'Brush',
    category: 'Extérieur'
  },
  {
    id: 'nettoyage',
    name: 'Nettoyage',
    description: 'Nettoyage après travaux et entretien',
    icon: 'Cleaning',
    category: 'Service'
  },
  {
    id: 'demenagement',
    name: 'Déménagement',
    description: 'Services de déménagement pour vos travaux',
    icon: 'Truck',
    category: 'Service'
  },
  {
    id: 'design_interieur',
    name: 'Design d\'intérieur',
    description: 'Conseil en décoration et aménagement d\'intérieur',
    icon: 'Palette',
    category: 'Conseil'
  },
  {
    id: 'bureau',
    name: 'Bureau',
    description: 'Aménagement d\'espaces de travail et bureaux',
    icon: 'Monitor',
    category: 'Pièce'
  },
  {
    id: 'chambre',
    name: 'Chambre',
    description: 'Rénovation et aménagement de chambres',
    icon: 'Bed',
    category: 'Pièce'
  },
  {
    id: 'salon',
    name: 'Salon',
    description: 'Rénovation et aménagement de salons',
    icon: 'Sofa',
    category: 'Pièce'
  },
  {
    id: 'salle_a_manger',
    name: 'Salle à manger',
    description: 'Aménagement de salles à manger',
    icon: 'UtensilsCrossed',
    category: 'Pièce'
  },
  {
    id: 'entree',
    name: 'Entrée',
    description: 'Aménagement d\'entrées et halls',
    icon: 'DoorOpen',
    category: 'Pièce'
  },
  {
    id: 'couloir',
    name: 'Couloir',
    description: 'Optimisation et décoration de couloirs',
    icon: 'ArrowRight',
    category: 'Pièce'
  },
  {
    id: 'buanderie',
    name: 'Buanderie',
    description: 'Aménagement de buanderies et espaces techniques',
    icon: 'WashingMachine',
    category: 'Utilitaire'
  },
  {
    id: 'cellier',
    name: 'Cellier',
    description: 'Aménagement de celliers et garde-manger',
    icon: 'Package',
    category: 'Utilitaire'
  },
  {
    id: 'spa',
    name: 'Spa & Wellness',
    description: 'Création d\'espaces spa et bien-être',
    icon: 'Waves',
    category: 'Luxe'
  },
  {
    id: 'home_cinema',
    name: 'Home cinéma',
    description: 'Aménagement de salles de cinéma privées',
    icon: 'Monitor',
    category: 'Luxe'
  },
  {
    id: 'cave_vin',
    name: 'Cave à vin',
    description: 'Création de caves à vin climatisées',
    icon: 'Wine',
    category: 'Luxe'
  },
  {
    id: 'salle_sport',
    name: 'Salle de sport',
    description: 'Aménagement de salles de sport privées',
    icon: 'Dumbbell',
    category: 'Luxe'
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Aménagement de studios et espaces multifonctions',
    icon: 'Home',
    category: 'Pièce'
  },
  {
    id: 'loft',
    name: 'Loft',
    description: 'Rénovation et aménagement de lofts',
    icon: 'Building',
    category: 'Pièce'
  },
  {
    id: 'duplex',
    name: 'Duplex',
    description: 'Aménagement de duplex et triplex',
    icon: 'Building2',
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
