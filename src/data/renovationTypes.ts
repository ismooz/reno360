
import { RenovationType } from '@/types';

export const renovationTypes: RenovationType[] = [
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
