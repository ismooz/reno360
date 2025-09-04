const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_IMAGE_DIMENSION = 1920;
const COMPRESSION_QUALITY = 0.8;

export const optimizeImage = async (file: File): Promise<File> => {
  // Si le fichier est déjà plus petit que 15MB, on le retourne tel quel
  if (file.size <= MAX_FILE_SIZE) {
    return file;
  }

  // Si ce n'est pas une image, on ne peut pas l'optimiser
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier dépasse la limite de 15MB et ne peut pas être compressé car ce n\'est pas une image.');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Impossible de créer le contexte canvas'));
        return;
      }

      // Calculer les nouvelles dimensions
      let { width, height } = calculateOptimalDimensions(
        img.naturalWidth,
        img.naturalHeight,
        MAX_IMAGE_DIMENSION
      );

      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir en blob avec compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Impossible de compresser l\'image'));
            return;
          }

          // Créer un nouveau fichier avec le blob compressé
          const optimizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          console.log(`Image optimisée: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`);
          resolve(optimizedFile);
        },
        file.type,
        COMPRESSION_QUALITY
      );
    };

    img.onerror = () => {
      reject(new Error('Impossible de charger l\'image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxDimension: number
): { width: number; height: number } => {
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;
  
  if (originalWidth > originalHeight) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension,
    };
  }
};

export const processFiles = async (files: FileList | File[]): Promise<File[]> => {
  const fileArray = Array.from(files);
  const processedFiles: File[] = [];

  for (const file of fileArray) {
    try {
      const optimizedFile = await optimizeImage(file);
      processedFiles.push(optimizedFile);
    } catch (error) {
      console.error(`Erreur lors de l'optimisation du fichier ${file.name}:`, error);
      // Si l'optimisation échoue, on garde le fichier original s'il est dans la limite
      if (file.size <= MAX_FILE_SIZE) {
        processedFiles.push(file);
      } else {
        throw new Error(`Le fichier "${file.name}" est trop volumineux et ne peut pas être optimisé.`);
      }
    }
  }

  return processedFiles;
};