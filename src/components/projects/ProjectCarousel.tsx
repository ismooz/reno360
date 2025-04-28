
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "@/components/ui/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProjectCarouselProps {
  images: string[];
}

const ProjectCarousel = ({ images }: ProjectCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!images || images.length === 0) {
    return <div className="text-center py-8">Aucune image disponible</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Carousel 
        className="w-full"
        onSlideChange={(api) => {
          if (api) setCurrentIndex(api.selectedScrollSnap());
        }}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <AspectRatio ratio={16/9} className="bg-muted">
                  <Image
                    src={image}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                    withSkeleton={true}
                  />
                </AspectRatio>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex items-center justify-between mt-2">
          <CarouselPrevious className="relative left-0 translate-y-0 -translate-x-1" />
          <div className="text-sm text-center">
            {currentIndex + 1} / {images.length}
          </div>
          <CarouselNext className="relative right-0 translate-y-0 translate-x-1" />
        </div>
      </Carousel>
    </div>
  );
};

export default ProjectCarousel;
