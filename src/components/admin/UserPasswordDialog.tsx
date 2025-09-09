import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePassword } from "@/utils/security";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserPasswordDialogProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, password: string) => void;
}

const UserPasswordDialog = ({
  userId,
  isOpen,
  onClose,
  onSave,
}: UserPasswordDialogProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const validation = validatePassword(value);
    setPasswordErrors(validation.errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    if (!password) {
      setError("Veuillez entrer un mot de passe");
      setIsSubmitting(false);
      return;
    }
    
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError("Le mot de passe ne respecte pas les critères de sécurité");
      setIsSubmitting(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Note: Password will be stored as plain text for localStorage compatibility
      // In production, this should be handled by Supabase Auth
      onSave(userId, password);
      onClose();
    } catch (err) {
      setError("Erreur lors du traitement du mot de passe");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Changer le mot de passe</DialogTitle>
          <DialogDescription>
            Définir un nouveau mot de passe pour cet utilisateur
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note de sécurité:</strong> En production, la gestion des mots de passe 
            devrait être entièrement gérée par Supabase Auth pour une sécurité optimale.
          </AlertDescription>
        </Alert>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleShowPassword}
                className="absolute right-0 top-0 h-full"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {passwordErrors.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Critères de sécurité :</p>
              {passwordErrors.map((error, index) => (
                <p key={index} className="text-xs text-destructive">• {error}</p>
              ))}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || passwordErrors.length > 0}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserPasswordDialog;