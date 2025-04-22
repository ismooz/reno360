
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface RenovationFormFilesProps {
  files: File[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
}

const RenovationFormFiles = ({ files, handleFileChange, removeFile }: RenovationFormFilesProps) => (
  <div className="space-y-2">
    <Label htmlFor="fileUpload">Photos ou documents (max 5 fichiers, 5 Mo chacun)</Label>
    <div className="border border-input rounded-md p-4">
      <input
        type="file"
        id="fileUpload"
        className="hidden"
        onChange={handleFileChange}
        multiple
        accept="image/*,.pdf,.doc,.docx"
      />
      <label 
        htmlFor="fileUpload"
        className="flex flex-col items-center justify-center cursor-pointer h-32 border-2 border-dashed border-input rounded-md hover:border-primary/50 transition-colors"
      >
        <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Cliquez pour ajouter des fichiers
        </span>
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

export default RenovationFormFiles;
