import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useFileUrl } from '@/hooks/useFileUrl';

interface ImageGalleryProps {
  attachments?: string[];
  className?: string;
}

const ImageGallery = ({ attachments = [], className }: ImageGalleryProps) => {
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { getFileUrl } = useFileUrl();
  const hasResolvedRef = useRef(false);
  const attachmentsKeyRef = useRef<string>('');

  useEffect(() => {
    // Create a stable key from attachments to detect actual changes
    const attachmentsKey = JSON.stringify(attachments);
    
    // Skip if already resolved for these attachments
    if (hasResolvedRef.current && attachmentsKeyRef.current === attachmentsKey) {
      return;
    }

    const resolveUrls = async () => {
      if (!attachments || attachments.length === 0) {
        setLoading(false);
        hasResolvedRef.current = true;
        attachmentsKeyRef.current = attachmentsKey;
        return;
      }

      setLoading(true);
      const urls: Record<string, string> = {};
      
      await Promise.all(
        attachments.map(async (attachment) => {
          try {
            const url = await getFileUrl(attachment);
            urls[attachment] = url;
          } catch (error) {
            console.error('Error resolving URL for', attachment, error);
            urls[attachment] = attachment;
          }
        })
      );
      
      setResolvedUrls(urls);
      setLoading(false);
      hasResolvedRef.current = true;
      attachmentsKeyRef.current = attachmentsKey;
    };

    resolveUrls();
  }, [attachments, getFileUrl]);

  if (!attachments || attachments.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Aucune pièce jointe
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des pièces jointes...
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
          const fileUrl = resolvedUrls[attachment] || attachment;
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
                  <VisuallyHidden>
                    <DialogTitle>Pièce jointe {index + 1}</DialogTitle>
                    <DialogDescription>Aperçu de l'image</DialogDescription>
                  </VisuallyHidden>
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
