
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
  withSkeleton?: boolean;
}

const Image = ({ alt, className, withSkeleton = false, ...props }: ImageProps) => {
  const [isLoading, setIsLoading] = useState(withSkeleton);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <div className={cn("relative", className)}>
      {isLoading && withSkeleton && (
        <Skeleton 
          className={cn(
            "absolute inset-0 bg-muted",
            className
          )}
        />
      )}
      
      {error ? (
        <div 
          className={cn(
            "flex items-center justify-center bg-muted text-muted-foreground",
            className
          )}
        >
          Image non disponible
        </div>
      ) : (
        <img
          loading="lazy"
          alt={alt}
          {...props}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "object-cover",
            isLoading && "opacity-0",
            className
          )}
        />
      )}
    </div>
  );
};

export default Image;
