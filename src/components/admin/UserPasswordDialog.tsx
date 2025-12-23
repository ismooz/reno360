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
import { validatePassword, generateSecurePassword } from "@/utils/security";
import { Eye, EyeOff, Mail, Key, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserPasswordDialogProps {
  userId: string;
  userEmail?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, password: string) => void;
}

const UserPasswordDialog = ({
  userId,
  userEmail,
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
  const [activeTab, setActiveTab] = useState("reset-link");

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const validation = validatePassword(value);
    setPasswordErrors(validation.errors);
  };

  const handleGeneratePassword = () => {
    const generated = generateSecurePassword(12);
    setPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    const validation = validatePassword(generated);
    setPasswordErrors(validation.errors);
  };

  const handleSendResetLink = async () => {
    if (!userEmail) {
      setError("Email de l'utilisateur non disponible");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-user-actions', {
        body: {
          action: 'send_reset_link',
          userId,
          email: userEmail
        }
      });

      if (fnError) {
        throw fnError;
      }

      toast.success("Lien de réinitialisation envoyé avec succès");
      onClose();
    } catch (err: any) {
      console.error('Error sending reset link:', err);
      setError("Erreur lors de l'envoi du lien de réinitialisation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetTempPassword = async (e: React.FormEvent) => {
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
      const { data, error: fnError } = await supabase.functions.invoke('admin-user-actions', {
        body: {
          action: 'set_temp_password',
          userId,
          email: userEmail,
          tempPassword: password
        }
      });

      if (fnError) {
        throw fnError;
      }

      toast.success("Mot de passe temporaire défini avec succès");
      onSave(userId, password);
      onClose();
    } catch (err: any) {
      console.error('Error setting temp password:', err);
      setError("Erreur lors de la définition du mot de passe temporaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClose = () => {
    setPassword("");
    setConfirmPassword("");
    setError("");
    setPasswordErrors([]);
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gestion du mot de passe</DialogTitle>
          <DialogDescription>
            Choisissez comment gérer le mot de passe de cet utilisateur
            {userEmail && <span className="block mt-1 font-medium">{userEmail}</span>}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reset-link" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Lien de reset</span>
              <span className="sm:hidden">Reset</span>
            </TabsTrigger>
            <TabsTrigger value="temp-password" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Mot de passe</span>
              <span className="sm:hidden">MDP</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="reset-link" className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              Un email sera envoyé à l'utilisateur avec un lien pour réinitialiser son mot de passe.
              Le lien expire après 24 heures.
            </div>
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button 
                onClick={handleSendResetLink} 
                disabled={isSubmitting || !userEmail}
              >
                {isSubmitting ? "Envoi..." : "Envoyer le lien"}
              </Button>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="temp-password" className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground mb-4">
              Définissez un mot de passe temporaire. L'utilisateur devra le changer à sa prochaine connexion.
            </div>
            
            <form onSubmit={handleSetTempPassword} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe temporaire</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGeneratePassword}
                    className="h-8"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Générer
                  </Button>
                </div>
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
                  {passwordErrors.map((err, index) => (
                    <p key={index} className="text-xs text-destructive">• {err}</p>
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
                <Button type="button" variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting || passwordErrors.length > 0}>
                  {isSubmitting ? "Enregistrement..." : "Définir le mot de passe"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserPasswordDialog;
