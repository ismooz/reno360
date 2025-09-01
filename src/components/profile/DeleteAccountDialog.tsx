import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountDialog = ({ isOpen, onClose }: DeleteAccountDialogProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== "SUPPRIMER") {
      toast({
        title: "Confirmation incorrecte",
        description: "Veuillez taper 'SUPPRIMER' pour confirmer.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Supprimer les données utilisateur du localStorage
      if (user) {
        // Supprimer les demandes de l'utilisateur
        const requests = JSON.parse(localStorage.getItem("renovationRequests") || "[]");
        const updatedRequests = requests.filter((req: any) => req.clientId !== user.id);
        localStorage.setItem("renovationRequests", JSON.stringify(updatedRequests));

        // Supprimer les notifications de l'utilisateur
        const notifications = JSON.parse(localStorage.getItem("userNotifications") || "[]");
        const updatedNotifications = notifications.filter((notif: any) => notif.userId !== user.id);
        localStorage.setItem("userNotifications", JSON.stringify(updatedNotifications));

        // Marquer l'utilisateur comme supprimé
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const updatedUsers = users.map((u: any) => 
          u.id === user.id ? { ...u, status: "deleted" } : u
        );
        localStorage.setItem("users", JSON.stringify(updatedUsers));
      }

      // Déconnecter l'utilisateur
      await signOut();

      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès.",
      });

      navigate("/");
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer mon compte</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Cette action est irréversible. Toutes vos données, y compris vos demandes de devis, seront définitivement supprimées.
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm">
                  Tapez <strong>SUPPRIMER</strong> pour confirmer :
                </Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount}
            disabled={isLoading || confirmText !== "SUPPRIMER"}
          >
            {isLoading ? "Suppression..." : "Supprimer définitivement"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;