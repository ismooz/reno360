import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, Edit2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { processFiles } from '@/utils/imageOptimizer';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { AttachmentMetadata } from '@/types';

interface FileWithMetadata {
  file: File;
  displayName: string;
  isEditing: boolean;
}

interface RenovationFormFilesProps {
  files: File[];
  fileMetadata: AttachmentMetadata[];
  handleFileChange: (files: File[], metadata: AttachmentMetadata[]) => void;
  removeFile: (index: number) => void;
}

const RenovationFormFiles = ({ files, fileMetadata, handleFileChange, removeFile }: RenovationFormFilesProps) => {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [filesWithMetadata, setFilesWithMetadata] = useState<FileWithMetadata[]>([]);

  const updateFilesWithMetadata = (newFiles: File[], newMetadata: AttachmentMetadata[]) => {
    const updatedFiles = newFiles.map((file, index) => ({
      file,
      displayName: newMetadata[index]?.displayName || file.name.split('.')[0],
      isEditing: false
    }));
    setFilesWithMetadata(updatedFiles);
  };

  // Synchroniser les états quand les props changent
  useState(() => {
    if (files.length > 0) {
      updateFilesWithMetadata(files, fileMetadata);
    }
  });

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsOptimizing(true);
    try {
      const optimizedFiles = await processFiles(selectedFiles);
      
      // Créer les métadonnées pour les nouveaux fichiers
      const newMetadata: AttachmentMetadata[] = optimizedFiles.map((file, index) => ({
        filename: '', // Sera rempli lors de l'upload
        displayName: file.name.split('.')[0], // Nom par défaut sans extension
        type: file.type.startsWith('image/') ? 'image' : 'document',
        originalName: file.name
      }));

      // Combiner avec les fichiers existants
      const allFiles = [...files, ...optimizedFiles];
      const allMetadata = [...fileMetadata, ...newMetadata];
      
      handleFileChange(allFiles, allMetadata);
      updateFilesWithMetadata(allFiles, allMetadata);
      
      if (optimizedFiles.length !== selectedFiles.length) {
        toast({
          title: "Succès",
          description: `${optimizedFiles.length} fichier(s) traité(s) avec succès. Certains fichiers ont été optimisés.`,
        });
      }
    } catch (error) {
      console.error('Erreur lors du traitement des fichiers:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Erreur lors du traitement des fichiers',
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
      // Reset input value
      e.target.value = '';
    }
  };

  const startEditing = (index: number) => {
    setFilesWithMetadata(prev => prev.map((item, i) => 
      i === index ? { ...item, isEditing: true } : item
    ));
  };

  const saveDisplayName = (index: number, newName: string) => {
    if (!newName.trim()) return;

    const updatedMetadata = [...fileMetadata];
    updatedMetadata[index] = {
      ...updatedMetadata[index],
      displayName: newName.trim()
    };

    handleFileChange(files, updatedMetadata);
    
    setFilesWithMetadata(prev => prev.map((item, i) => 
      i === index ? { ...item, displayName: newName.trim(), isEditing: false } : item
    ));
  };

  const cancelEditing = (index: number) => {
    setFilesWithMetadata(prev => prev.map((item, i) => 
      i === index ? { ...item, isEditing: false } : item
    ));
  };

  const handleRemoveFile = (index: number) => {
    removeFile(index);
    setFilesWithMetadata(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 p-5 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary">Pièces jointes</h3>
          <p className="text-sm text-muted-foreground">Photos ou documents (max 5 fichiers, 15 Mo chacun)</p>
        </div>
      </div>
      <div className="border border-input rounded-md p-4 bg-background">
        <input
          type="file"
          id="fileUpload"
          className="hidden"
          onChange={handleFileSelection}
          multiple
          accept="image/*,.pdf,.doc,.docx"
          disabled={isOptimizing}
        />
        <label 
          htmlFor="fileUpload"
          className={`flex flex-col items-center justify-center h-28 border-2 border-dashed border-border rounded-md transition-colors ${
            isOptimizing 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer hover:border-primary/50 hover:bg-muted/50'
          }`}
        >
          {isOptimizing ? (
            <>
              <Loader2 className="h-6 w-6 mb-2 text-muted-foreground animate-spin" />
              <span className="text-sm text-muted-foreground">
                Optimisation des images...
              </span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Cliquez pour ajouter des fichiers
              </span>
              <span className="text-xs text-muted-foreground/70 mt-1">
                Images, PDF, documents Word acceptés
              </span>
            </>
          )}
        </label>

        {filesWithMetadata.length > 0 && (
          <div className="mt-4 space-y-2">
            {filesWithMetadata.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border border-border/30">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">
                    Fichier: {item.file.name}
                  </div>
                  {item.isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        defaultValue={item.displayName}
                        placeholder="Nom à afficher"
                        className="h-8 bg-background"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveDisplayName(index, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            cancelEditing(index);
                          }
                        }}
                        onBlur={(e) => saveDisplayName(index, e.target.value)}
                        autoFocus
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => cancelEditing(index)}
                      >
                        Annuler
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {item.displayName}
                      </span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => startEditing(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  className="text-destructive hover:text-destructive"
                >
                  Supprimer
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RenovationFormFiles;