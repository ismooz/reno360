import { RenovationType } from "@/types";
import plomberieImg from '@/assets/services/plomberie.jpg';
import electriciteImg from '@/assets/services/electricite.jpg';
import peintureImg from '@/assets/services/peinture.jpg';
import cuisineImg from '@/assets/services/cuisine.jpg';
import salleDeBainImg from '@/assets/services/salle_de_bain.jpg';

// Map des images par ID de service
const serviceImages: Record<string, string> = {
  'plomberie': plomberieImg,
  'electricite': electriciteImg,
  'peinture': peintureImg,
  'cuisine': cuisineImg,
  'salle_de_bain': salleDeBainImg,
};

// Image par défaut pour les services sans image spécifique
const defaultImage = peintureImg;

interface ServiceHeaderProps {
  renovationType: RenovationType | null;
  serviceName: string;
}

export const ServiceHeader = ({ renovationType, serviceName }: ServiceHeaderProps) => {
  const backgroundImage = renovationType?.id 
    ? serviceImages[renovationType.id] || defaultImage
    : defaultImage;

  const title = renovationType?.name || serviceName;
  const description = renovationType?.description || `Service de ${serviceName.toLowerCase()} professionnel`;
  const icon = renovationType?.icon || '🔧';

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt={`Service ${title}`}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto text-center px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-6xl mb-4">{icon}</div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
            {title}
          </h1>
          <p className="text-lg sm:text-xl text-white/90 mb-6 max-w-2xl mx-auto">
            {description}
          </p>
          <a 
            href="#formulaire"
            className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-6 py-2 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <span className="text-white font-medium">
              Demande de devis personnalisé
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};