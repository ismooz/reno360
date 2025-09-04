import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { useRenovationRequests } from '@/hooks/useRenovationRequests';

interface ImageGalleryProps {
  attachments?: string[];
  className?: string;
}

const ImageGallery = ({ attachments = [], className }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { getFileUrl } = useRenovationRequests();

  if (!attachments || attachments.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Aucune pièce jointe
      </div>
    );
  }

  const isImage = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

  const getFileName = (url: string): string => {
    return url.split('/').pop() || 'Fichier';
  };

  const downloadFile = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = getFileName(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Pièces jointes:</span>
        <Badge variant="secondary">
          {attachments.length} fichier{attachments.length > 1 ? 's' : ''}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {attachments.map((attachment, index) => {
          const fileUrl = getFileUrl(attachment);
          const fileName = getFileName(attachment);
          const isImg = isImage(attachment);
          
          if (isImg) {
            return (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <div className="relative group cursor-pointer rounded-md overflow-hidden border border-input">
                    <Image
                      src={fileUrl}
                      alt={`Pièce jointe ${index + 1}`}
                      className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                      withSkeleton
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                      onClick={() => downloadFile(fileUrl)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Image
                      src={fileUrl}
                      alt={`Pièce jointe ${index + 1}`}
                      className="w-full max-h-[80vh] object-contain"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            );
          } else {
            return (
              <div
                key={index}
                className="relative group cursor-pointer rounded-md overflow-hidden border border-input p-3 h-20 flex flex-col items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
                onClick={() => downloadFile(fileUrl)}
              >
                <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-center truncate w-full" title={fileName}>
                  {fileName}
                </span>
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Download className="h-4 w-4 text-foreground" />
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default ImageGallery;