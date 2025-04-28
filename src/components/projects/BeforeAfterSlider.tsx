
import { useState } from "react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

const BeforeAfterSlider = ({ beforeImage, afterImage }: BeforeAfterSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percent, 0), 100));
  };

  return (
    <div 
      className="relative w-full max-w-4xl h-[400px] mx-auto overflow-hidden cursor-ew-resize"
      onMouseMove={handleMouseMove}
    >
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundImage: `url(${afterImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div 
        className="absolute top-0 left-0 h-full"
        style={{
          width: `${sliderPosition}%`,
          backgroundImage: `url(${beforeImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRight: '2px solid white'
        }}
      />
      <div 
        className="absolute top-0 bottom-0"
        style={{
          left: `${sliderPosition}%`,
          width: '4px',
          backgroundColor: 'white',
          transform: 'translateX(-50%)',
          cursor: 'ew-resize'
        }}
      >
        <div className="absolute top-1/2 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg" />
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
