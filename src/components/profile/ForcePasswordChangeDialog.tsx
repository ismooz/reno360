import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { validatePassword } from "@/utils/security";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface ForcePasswordChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForcePasswordChangeDialog = ({ isOpen, onClose }: ForcePasswordChangeDialogProps) => {
  const { updatePassword, updateUserProfile } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    const validation = validatePassword(value);
    setPasswordErrors(validation.errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!newPassword) {
      setError("Veuillez entrer un nouveau mot de passe");
      return;
    }
    
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError("Le mot de passe ne respecte pas les critères de sécurité");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);

    try {
      // Update the password
      await updatePassword("", newPassword);
      
      // Remove the must_change_password flag
      await updateUserProfile({
        data: {
          must_change_password: false,
          temp_password_set_at: null
        }
      });

      toast.success("Mot de passe modifié avec succès");
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors du changement de mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Changement de mot de passe requis</DialogTitle>
          <DialogDescription>
            Vous devez changer votre mot de passe pour continuer à utiliser l'application.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Un mot de passe temporaire vous a été attribué. Pour des raisons de sécurité, 
            vous devez le changer immédiatement.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
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
              {passwordErrors.map((err, index) => (
                <p key={index} className="text-xs text-destructive">• {err}</p>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirm-new-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading || passwordErrors.length > 0}
              className="w-full"
            >
              {isLoading ? "Mise à jour..." : "Changer le mot de passe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForcePasswordChangeDialog;
