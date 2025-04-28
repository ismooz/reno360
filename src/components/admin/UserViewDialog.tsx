
import { User } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UserViewDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserViewDialog = ({ user, isOpen, onClose }: UserViewDialogProps) => {
  if (!user) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Jamais";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Informations utilisateur</DialogTitle>
          <DialogDescription>
            Détails complets du profil utilisateur
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {user.name || "Sans nom"}
            </h3>
            <div className="flex gap-2">
              <Badge variant={user.role === "admin" ? "default" : "outline"}>
                {user.role === "admin" ? "Admin" : "Client"}
              </Badge>
              <Badge
                variant={
                  user.status === "active"
                    ? "default"
                    : user.status === "inactive"
                    ? "secondary"
                    : "destructive"
                }
              >
                {user.status === "active"
                  ? "Actif"
                  : user.status === "inactive"
                  ? "Inactif"
                  : "Supprimé"}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
              <p>{user.phone || "Non spécifié"}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date d'inscription</p>
              <p>{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dernière connexion</p>
              <p>{formatDate(user.lastLogin)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre de demandes</p>
              <p>{user.requestCount || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dernière demande</p>
              <p>{formatDate(user.lastRequestDate)}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserViewDialog;
