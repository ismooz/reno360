
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, loading, error } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  
  // Form errors
  const [formError, setFormError] = useState<string | null>(null);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!loginEmail || !loginPassword) {
      setFormError("Veuillez remplir tous les champs");
      return;
    }
    
    try {
      await signIn(loginEmail, loginPassword);
      navigate("/dashboard");
    } catch (err) {
      // Error is handled by useAuth
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      setFormError("Veuillez remplir tous les champs");
      return;
    }
    
    if (registerPassword !== registerConfirmPassword) {
      setFormError("Les mots de passe ne correspondent pas");
      return;
    }
    
    try {
      await signUp(registerEmail, registerPassword, registerName);
      navigate("/dashboard");
    } catch (err) {
      // Error is handled by useAuth
    }
  };
  
  const resetAdminAccount = () => {
    // Réinitialiser le compte administrateur
    const now = new Date().toISOString();
    const adminUser = {
      id: "1",
      email: "admin@reno360.ch",
      name: "Administrateur",
      createdAt: now,
      lastLogin: now,
      role: "admin",
      status: "active",
      password: "admin123",
      requestCount: 0
    };
    
    // Récupérer les utilisateurs existants
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    
    // Filtrer l'admin existant et ajouter le nouveau
    const updatedUsers = [...storedUsers.filter((user: any) => user.email !== "admin@reno360.ch"), adminUser];
    
    // Sauvegarder dans localStorage
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    
    // Préremplir les champs de connexion
    setLoginEmail("admin@reno360.ch");
    setLoginPassword("admin123");
    
    toast.success("Compte administrateur réinitialisé avec succès");
  };
  
  return (
    <Layout>
      <div className="container py-16 max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Accédez à votre espace client</CardTitle>
            <CardDescription>
              Connectez-vous ou créez un compte pour suivre vos demandes de rénovation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="register">Inscription</TabsTrigger>
              </TabsList>
              
              {(error || formError) && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error || formError}
                  </AlertDescription>
                </Alert>
              )}
              
              <TabsContent value="login">
                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="votre@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Mot de passe</Label>
                        <a 
                          href="#" 
                          className="text-sm text-primary underline-offset-4 hover:underline"
                        >
                          Mot de passe oublié?
                        </a>
                      </div>
                      <Input 
                        id="password" 
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Connexion en cours..." : "Se connecter"}
                    </Button>
                    
                    <div className="mt-4 pt-4 border-t text-center">
                      <p className="text-sm text-muted-foreground mb-2">Problème d'accès administrateur?</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={resetAdminAccount}
                      >
                        Réinitialiser le compte admin
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input 
                        id="name" 
                        placeholder="Jean Dupont"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input 
                        id="register-email" 
                        type="email" 
                        placeholder="votre@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Mot de passe</Label>
                      <Input 
                        id="register-password" 
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                      <Input 
                        id="confirm-password" 
                        type="password"
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Création en cours..." : "Créer un compte"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Auth;
