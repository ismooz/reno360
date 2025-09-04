
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { processFiles } from '@/utils/imageOptimizer';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface RenovationFormFilesProps {
  files: File[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
}

const RenovationFormFiles = ({ files, handleFileChange, removeFile }: RenovationFormFilesProps) => {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsOptimizing(true);
    try {
      const optimizedFiles = await processFiles(selectedFiles);
      
      // Créer un événement simulé avec les fichiers optimisés
      const fakeEvent = {
        ...e,
        target: {
          ...e.target,
          files: optimizedFiles as any
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleFileChange(fakeEvent);
      
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

  return (
    <div className="space-y-2">
      <Label htmlFor="fileUpload">Photos ou documents (max 5 fichiers, 15 Mo chacun)</Label>
    <div className="border border-input rounded-md p-4">
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
        className={`flex flex-col items-center justify-center h-32 border-2 border-dashed border-input rounded-md transition-colors ${
          isOptimizing 
            ? 'cursor-not-allowed opacity-50' 
            : 'cursor-pointer hover:border-primary/50'
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
          </>
        )}
      </label>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded-md">
              <span className="text-sm truncate max-w-[80%]">{file.name}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => removeFile(index)}
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
