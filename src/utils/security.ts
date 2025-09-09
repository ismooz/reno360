/**
 * Utilitaires de sécurité pour la validation et l'assainissement des données
 * NOTE: Le hachage des mots de passe est géré par Supabase Auth pour la sécurité
 */

// Fonction pour nettoyer les données sensibles (conservée pour compatibilité)
export const sanitizeUserData = (user: any) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Validation des entrées
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Fonction pour générer un mot de passe sécurisé
export const generateSecurePassword = (length: number = 12): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};