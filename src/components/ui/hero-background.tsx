import { useState, useEffect } from 'react';
import renovation1 from '@/assets/renovation-1.jpg';
import renovation2 from '@/assets/renovation-2.jpg';
import renovation3 from '@/assets/renovation-3.jpg';
import renovation4 from '@/assets/renovation-4.jpg';
import renovation5 from '@/assets/renovation-5.jpg';

const images = [renovation1, renovation2, renovation3, renovation4, renovation5];

export const HeroBackground = ({ children }: { children: React.ReactNode }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Renovation ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
};