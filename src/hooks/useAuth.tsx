
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "@/types";
import { toast } from "sonner";
import { hashPassword, verifyPassword } from "@/utils/security";

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
  loading: boolean;
  error: string | null;
  isAdmin: () => boolean;
}

// Dans une application réelle, ceci serait connecté à un backend
// Pour l'instant, nous utilisons localStorage pour simuler la persistance
const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
  updatePassword: async () => {},
  updateUserProfile: async () => {},
  loading: false,
  error: null,
  isAdmin: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Check for admin status
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const sendEmailNotification = (userId: string, type: string) => {
    // Dans une application réelle, ceci enverrait un email via un backend
    console.log(`Email notification sent: ${type} to user ${userId}`);
    
    // Simuler un envoi d'email
    const templates: Record<string, { subject: string, message: string }> = {
      account_creation: {
        subject: "Bienvenue sur reno360.ch",
        message: "Votre compte a été créé avec succès."
      },
      password_change: {
        subject: "Modification du mot de passe",
        message: "Votre mot de passe a été modifié avec succès."
      },
      account_closure: {
        subject: "Désactivation de compte",
        message: "Votre compte a été désactivé."
      },
      account_deletion: {
        subject: "Suppression de compte",
        message: "Votre compte a été supprimé."
      }
    };
    
    const template = templates[type];
    if (template) {
      // Sauvegarder la notification dans localStorage
      const notifications = JSON.parse(localStorage.getItem("userNotifications") || "[]");
      notifications.push({
        id: Date.now().toString(),
        userId,
        type,
        title: template.subject,
        message: template.message,
        read: false,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem("userNotifications", JSON.stringify(notifications));
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simuler une requête API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Dans une application réelle, nous vérifierions les identifiants avec le backend
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const foundUser = storedUsers.find((u: User & { password: string }) => 
        u.email === email && u.status !== 'deleted'
      );
      
      if (!foundUser) {
        throw new Error("Email ou mot de passe incorrect");
      }
      
      // Vérifier le mot de passe hashé
      const isPasswordValid = await verifyPassword(password, foundUser.password);
      if (!isPasswordValid) {
        throw new Error("Email ou mot de passe incorrect");
      }
      
      if (foundUser.status === 'inactive') {
        throw new Error("Ce compte est désactivé. Veuillez contacter l'administrateur.");
      }
      
      // Update last login date
      const updatedUsers = storedUsers.map((u: User & { password: string }) => 
        u.id === foundUser.id ? { ...u, lastLogin: new Date().toISOString() } : u
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem("user", JSON.stringify(userWithoutPassword));
      
      toast.success("Connexion réussie");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
      toast.error(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simuler une requête API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Vérifier si l'utilisateur existe déjà
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      if (storedUsers.some((u: User) => u.email === email && u.status !== 'deleted')) {
        throw new Error("Cet email est déjà utilisé");
      }
      
      // Créer un nouvel utilisateur
      const now = new Date().toISOString();
      const hashedPassword = await hashPassword(password);
      const newUser = {
        id: Date.now().toString(),
        email,
        name,
        createdAt: now,
        lastLogin: now,
        role: 'user' as const, // Fix: explicitly type as 'user'
        status: 'active' as const, // Fix: explicitly type as 'active'
        requestCount: 0,
        password: hashedPassword,
      };
      
      // Sauvegarder dans localStorage
      storedUsers.push(newUser);
      localStorage.setItem("users", JSON.stringify(storedUsers));
      
      // Connecter l'utilisateur
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      localStorage.setItem("user", JSON.stringify(userWithoutPassword));
      
      // Envoyer notification de création de compte
      sendEmailNotification(newUser.id, 'account_creation');
      
      toast.success("Compte créé avec succès");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
      toast.error(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error("Utilisateur non connecté");
      }
      
      // Simuler une requête API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Vérifier le mot de passe actuel
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const foundUser = storedUsers.find((u: User & { password: string }) => 
        u.id === user.id
      );
      
      if (!foundUser) {
        throw new Error("Utilisateur non trouvé");
      }
      
      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await verifyPassword(currentPassword, foundUser.password);
      if (!isCurrentPasswordValid) {
        throw new Error("Mot de passe actuel incorrect");
      }
      
      // Mettre à jour le mot de passe
      const hashedNewPassword = await hashPassword(newPassword);
      const updatedUsers = storedUsers.map((u: User & { password: string }) => 
        u.id === user.id ? { ...u, password: hashedNewPassword } : u
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      // Envoyer notification de changement de mot de passe
      sendEmailNotification(user.id, 'password_change');
      
      toast.success("Mot de passe mis à jour");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
      toast.error(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error("Utilisateur non connecté");
      }
      
      // Simuler une requête API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mettre à jour les données utilisateur
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const updatedUsers = storedUsers.map((u: User & { password: string }) => 
        u.id === user.id ? { ...u, ...userData } : u
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      // Mettre à jour l'utilisateur courant
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Si le statut change, envoyer la notification appropriée
      if (userData.status === 'inactive') {
        sendEmailNotification(user.id, 'account_closure');
      }
      if (userData.status === 'deleted') {
        sendEmailNotification(user.id, 'account_deletion');
      }
      
      toast.success("Profil mis à jour");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
      toast.error(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.info("Vous êtes déconnecté");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      signIn, 
      signUp, 
      signOut, 
      updatePassword, 
      updateUserProfile, 
      loading, 
      error, 
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
