
import { useState } from "react";
import ReactCompareImage from "react-compare-image";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

const BeforeAfterSlider = ({ beforeImage, afterImage }: BeforeAfterSliderProps) => {
  const [hasError, setHasError] = useState(false);

  const handleError = (error: Error) => {
    console.error("Error loading images:", error);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-8 text-muted-foreground">
        Une erreur est survenue lors du chargement des images
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative">
        <ReactCompareImage
          leftImage={beforeImage}
          rightImage={afterImage}
          onError={handleError}
          leftImageLabel="Avant"
          rightImageLabel="Après"
          handle={
            <div className="w-1 bg-white rounded-full">
              <div className="absolute top-1/2 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg flex items-center justify-center">
                <span className="absolute -left-6 text-white text-xs font-bold">◀</span>
                <span className="absolute -right-6 text-white text-xs font-bold">▶</span>
              </div>
            </div>
          }
          handleSize={40}
          sliderLineWidth={1}
          hover={false}
        />
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
