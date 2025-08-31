
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserProfile: (userData: any) => Promise<void>;
  loading: boolean;
  error: string | null;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: () => {},
  updatePassword: async () => {},
  updateUserProfile: async () => {},
  loading: false,
  error: null,
  isAdmin: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for admin status
  const isAdmin = () => {
    return user?.user_metadata?.role === 'admin';
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

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
            role: 'user'
          }
        }
      });

      if (error) {
        throw error;
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
