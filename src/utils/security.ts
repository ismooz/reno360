/**
 * Utilitaires de sécurité pour le hachage des mots de passe
 * Dans un environnement de production, utilisez bcrypt ou argon2
 */

// Fonction simple de hachage pour la démo (à remplacer par bcrypt en production)
export const hashPassword = async (password: string): Promise<string> => {
  // Utilisation de l'API Web Crypto pour un hachage basique
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "salt_secret_key"); // Salt simple pour la démo
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
};

// Fonction pour nettoyer les données sensibles
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