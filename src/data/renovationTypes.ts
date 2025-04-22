
import { RenovationType } from '@/types';

export const renovationTypes: RenovationType[] = [
  {
    id: 'peinture',
    name: 'Peinture',
    description: 'Services de peinture intérieure et extérieure pour tous types de bâtiments',
    icon: 'PaintBucket'
  },
  {
    id: 'plomberie',
    name: 'Plomberie',
    description: 'Installation et réparation de systèmes de plomberie pour cuisines et salles de bains',
    icon: 'Droplets'
  },
  {
    id: 'electricite',
    name: 'Électricité',
    description: 'Services d\'installation électrique et de mise aux normes',
    icon: 'Zap'
  },
  {
    id: 'chauffage',
    name: 'Chauffage',
    description: 'Installation et réparation de systèmes de chauffage',
    icon: 'Thermometer'
  },
  {
    id: 'isolation',
    name: 'Isolation',
    description: 'Services d\'isolation thermique et acoustique',
    icon: 'Shield'
  },
  {
    id: 'menuiserie',
    name: 'Menuiserie',
    description: 'Rénovation de portes, fenêtres et autres éléments en bois',
    icon: 'Construction'
  },
  {
    id: 'carrelage',
    name: 'Carrelage',
    description: 'Installation et rénovation de carrelage et revêtements de sol',
    icon: 'Grid'
  },
  {
    id: 'maconnerie',
    name: 'Maçonnerie',
    description: 'Travaux de maçonnerie générale et de rénovation',
    icon: 'Bricks'
  },
  {
    id: 'toiture',
    name: 'Toiture',
    description: 'Réparation et rénovation de toitures',
    icon: 'Home'
  },
  {
    id: 'amenagement',
    name: 'Aménagement',
    description: 'Aménagement intérieur et extérieur',
    icon: 'LayoutDashboard'
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
