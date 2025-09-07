
import { useState, useEffect } from "react";
import { User } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash, MailCheck, UserCog, Eye, RefreshCw } from "lucide-react";
import UserFormDialog from "./UserFormDialog";
import UserViewDialog from "./UserViewDialog";
import UserPasswordDialog from "./UserPasswordDialog";
import { sanitizeUserData, hashPassword } from "@/utils/security";
import { supabase } from "@/integrations/supabase/client";

const UserManagement = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState({
    status: "all",
    search: "",
  });

  // Fonction pour charger tous les utilisateurs depuis Supabase
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('list-users');
      
      if (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        toast.error('Erreur lors du chargement des utilisateurs');
        // Fallback sur localStorage en cas d'erreur
        const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
        const usersWithoutPasswords = storedUsers.map(sanitizeUserData);
        setUsers(usersWithoutPasswords);
      } else {
        console.log('Utilisateurs chargés:', data.users);
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      // Fallback sur localStorage
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const usersWithoutPasswords = storedUsers.map(sanitizeUserData);
      setUsers(usersWithoutPasswords);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Appliquer les filtres
    let result = [...users];

    if (filter.status !== "all") {
      result = result.filter((u) => u.status === filter.status);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsers(result);
  }, [users, filter]);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserFormOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setIsPasswordDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (!selectedUser) return;

    // Dans une application réelle, nous enverrions cette requête à un backend
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = storedUsers.map((u: any) =>
      u.id === selectedUser.id ? { ...u, status: "deleted" } : u
    );
    
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    
    // Mettre à jour l'état local
    setUsers(
      users.map((u) =>
        u.id === selectedUser.id ? { ...u, status: "deleted" } : u
      )
    );
    
    // Envoyer un email de notification (simulé)
    // Dans une application réelle, cela serait géré par le backend
    const notifications = JSON.parse(localStorage.getItem("userNotifications") || "[]");
    notifications.push({
      id: Date.now().toString(),
      userId: selectedUser.id,
      type: "account_deletion",
      title: "Suppression de compte",
      message: "Votre compte a été supprimé par un administrateur.",
      read: false,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("userNotifications", JSON.stringify(notifications));
    
    setIsDeleteDialogOpen(false);
    toast.success(`L'utilisateur ${selectedUser.name || selectedUser.email} a été supprimé.`);
  };

  const handleUserSaved = (updatedUser: User) => {
    // Mettre à jour l'utilisateur dans localStorage avec sécurité
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const userIndex = storedUsers.findIndex((u: any) => u.id === updatedUser.id);
    
    if (userIndex !== -1) {
      // Conserver le mot de passe existant
      const existingPassword = storedUsers[userIndex].password;
      storedUsers[userIndex] = { ...updatedUser, password: existingPassword };
    } else {
      // Nouvel utilisateur avec mot de passe par défaut hashé
      hashPassword("password123").then(hashedPassword => {
        storedUsers.push({ ...updatedUser, password: hashedPassword });
        localStorage.setItem("users", JSON.stringify(storedUsers));
      });
      return; // Sortir ici pour éviter la double sauvegarde
    }
    
    localStorage.setItem("users", JSON.stringify(storedUsers));
    
    // Mettre à jour l'état local
    setUsers((prevUsers) => {
      const existingUserIndex = prevUsers.findIndex((u) => u.id === updatedUser.id);
      if (existingUserIndex !== -1) {
        return prevUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      } else {
        return [...prevUsers, updatedUser];
      }
    });
    
    setIsUserFormOpen(false);
    toast.success(`Utilisateur ${updatedUser.name || updatedUser.email} enregistré.`);
  };

  const handlePasswordChanged = (userId: string, newPassword: string) => {
    // Le mot de passe est déjà hashé par UserPasswordDialog
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = storedUsers.map((u: any) =>
      u.id === userId ? { ...u, password: newPassword } : u
    );
    
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setIsPasswordDialogOpen(false);
    
    // Envoyer un email de notification (simulé)
    const notifications = JSON.parse(localStorage.getItem("userNotifications") || "[]");
    notifications.push({
      id: Date.now().toString(),
      userId,
      type: "password_change",
      title: "Modification du mot de passe",
      message: "Votre mot de passe a été modifié par un administrateur.",
      read: false,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("userNotifications", JSON.stringify(notifications));
    
    toast.success("Mot de passe modifié avec succès.");
  };

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

  if (!isAdmin()) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium mb-2">Accès non autorisé</h3>
        <p className="text-muted-foreground">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full mx-auto px-3 min-w-0">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48">
            <Select
              value={filter.status}
              onValueChange={(value) => setFilter({ ...filter, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="deleted">Supprimé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              placeholder="Rechercher par nom ou email..."
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={loadUsers} 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
            <span className="sm:hidden">Actualiser</span>
          </Button>
          <Button onClick={() => {
            setSelectedUser(null);
            setIsUserFormOpen(true);
          }} className="w-full sm:w-auto">
            <span className="hidden sm:inline">Ajouter un utilisateur</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium mb-2">Aucun utilisateur trouvé</h3>
          <p className="text-muted-foreground">
            Aucun utilisateur ne correspond à vos critères de recherche.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="rounded-md border min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Nom</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[80px]">Rôle</TableHead>
                  <TableHead className="min-w-[80px]">Statut</TableHead>
                  <TableHead className="min-w-[120px] hidden md:table-cell">Inscription</TableHead>
                  <TableHead className="min-w-[120px] hidden lg:table-cell">Dernière connexion</TableHead>
                  <TableHead className="min-w-[100px] hidden sm:table-cell">Demandes</TableHead>
                  <TableHead className="text-right min-w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || "-"}</TableCell>
                    <TableCell className="break-all">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "outline"}>
                        {user.role === "admin" ? "Admin" : "Client"}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(user.lastLogin)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {user.requestCount || 0}
                      {user.lastRequestDate && (
                        <span className="text-xs text-muted-foreground block">
                          Dernière: {formatDate(user.lastRequestDate)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewUser(user)}
                          title="Voir"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditUser(user)}
                          title="Modifier"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 hidden sm:inline-flex"
                          onClick={() => handleChangePassword(user)}
                          title="Changer le mot de passe"
                        >
                          <UserCog className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.id === currentUser?.id}
                          title="Supprimer"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <UserFormDialog
        user={selectedUser}
        isOpen={isUserFormOpen}
        onClose={() => setIsUserFormOpen(false)}
        onSave={handleUserSaved}
      />

      <UserViewDialog
        user={selectedUser}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
      />

      <UserPasswordDialog
        userId={selectedUser?.id || ""}
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onSave={handlePasswordChanged}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
