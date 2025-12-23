
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserProfile: (userData: any) => Promise<void>;
  loading: boolean;
  error: string | null;
  isAdmin: () => boolean;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  updateUserProfile: async () => {},
  loading: false,
  error: null,
  isAdmin: () => false,
  checkAdminStatus: async () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          checkAdminStatus();
        } else {
          setIsAdminUser(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        checkAdminStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user) {
      setIsAdminUser(false);
      return false;
    }
    try {
      const { data, error } = await supabase.rpc('is_admin', { check_user_id: user.id });
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdminUser(false);
        return false;
      }
      const adminStatus = data || false;
      setIsAdminUser(adminStatus);
      return adminStatus;
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdminUser(false);
      return false;
    }
  };

  const isAdmin = (): boolean => {
    return isAdminUser;
  };

  const sendEmailNotification = async (email: string, type: string, data?: any) => {
    const templates: Record<string, { subject: string, html: string }> = {
      account_creation: {
        subject: "Bienvenue sur reno360.ch",
        html: `
          <h1>Bienvenue sur Reno360 !</h1>
          <p>Votre compte a été créé avec succès.</p>
          <p>Vous pouvez maintenant accéder à votre espace client pour suivre vos demandes de rénovation.</p>
          <p>Cordialement,<br>L'équipe Reno360</p>
        `
      },
      renovation_request_copy: {
        subject: "Copie de votre demande de rénovation",
        html: `
          <h1>Votre demande de rénovation</h1>
          <p>Bonjour ${data?.name || ''},</p>
          <p>Nous avons bien reçu votre demande de rénovation. Voici un résumé :</p>
          <ul>
            <li><strong>Type de rénovation :</strong> ${data?.renovationType || ''}</li>
            <li><strong>Description :</strong> ${data?.description || ''}</li>
            <li><strong>Budget :</strong> ${data?.budget || 'Non spécifié'}</li>
          </ul>
          <p>Nous vous contacterons dans les plus brefs délais.</p>
          <p>Cordialement,<br>L'équipe Reno360</p>
        `
      }
    };
    
    const template = templates[type];
    if (template) {
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: email,
            subject: template.subject,
            html: template.html
          }
        });
      } catch (error) {
        console.error('Failed to send email:', error);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      toast.success("Connexion réussie");
    } catch (err: any) {
      const errorMessage = err.message === 'Invalid login credentials' 
        ? "Email ou mot de passe incorrect" 
        : err.message;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
            phone: phone,
            role: 'user'
          }
        }
      });

      if (error) {
        throw error;
      }
      
      // Update profiles table with phone number if user was created
      if (data.user && phone) {
        await supabase
          .from('profiles')
          .update({ phone: phone, display_name: name })
          .eq('user_id', data.user.id);
      }
      
      // Envoyer notification de création de compte
      await sendEmailNotification(email, 'account_creation');
      
      toast.success("Compte créé avec succès ! Vérifiez votre email.");
    } catch (err: any) {
      const errorMessage = err.message === 'User already registered' 
        ? "Cet email est déjà utilisé" 
        : err.message;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use current origin to ensure correct domain (not localhost in production)
      const redirectUrl = `${window.location.origin}/auth?type=recovery`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }
      
      toast.success("Email de récupération envoyé ! Vérifiez votre boîte de réception.");
    } catch (err: any) {
      setError(err.message);
      toast.error("Erreur lors de l'envoi de l'email de récupération");
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
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }
      
      toast.success("Mot de passe mis à jour");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error("Utilisateur non connecté");
      }
      
      const { error } = await supabase.auth.updateUser({
        data: userData
      });

      if (error) {
        throw error;
      }
      
      toast.success("Profil mis à jour");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.info("Vous êtes déconnecté");
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      signOut,
      resetPassword,
      updatePassword,
      updateUserProfile,
      loading,
      error,
      isAdmin,
      checkAdminStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
