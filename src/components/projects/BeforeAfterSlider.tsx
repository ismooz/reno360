
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
    <div className="relative w-full max-w-4xl mx-auto">
      <div 
        className="relative w-full h-[400px] mx-auto overflow-hidden cursor-ew-resize"
        onMouseMove={handleMouseMove}
      >
        {/* After Image (right side) - Fixed position */}
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `url(${afterImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Before Image (left side) - Fixed position with clip */}
        <div 
          className="absolute top-0 left-0 h-full"
          style={{
            width: `${sliderPosition}%`,
            backgroundImage: `url(${beforeImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRight: '2px solid white'
          }}
        />
        
        {/* Slider handle */}
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
          <div className="absolute top-1/2 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="flex items-center justify-center">
              <span className="absolute -left-6 text-white text-xs font-bold shadow-sm">◀</span>
              <span className="absolute -right-6 text-white text-xs font-bold shadow-sm">▶</span>
            </div>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2 text-sm font-medium">
        <div className="bg-black/70 text-white px-3 py-1 rounded">Avant</div>
        <div className="bg-black/70 text-white px-3 py-1 rounded">Après</div>
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
