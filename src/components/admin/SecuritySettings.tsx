import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { generateSecurePassword } from "@/utils/security";
import { Shield, Eye, EyeOff, RefreshCw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SecuritySettings {
  enforceStrongPasswords: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  requirePasswordChange: boolean;
  passwordExpirationDays: number;
}

const SecuritySettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SecuritySettings>({
    enforceStrongPasswords: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    requirePasswordChange: false,
    passwordExpirationDays: 90
  });
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem("securitySettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (key: keyof SecuritySettings, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGeneratePassword = () => {
    setIsGeneratingPassword(true);
    setTimeout(() => {
      const password = generateSecurePassword(16);
      setNewAdminPassword(password);
      setIsGeneratingPassword(false);
    }, 500);
  };

  const saveSettings = () => {
    localStorage.setItem("securitySettings", JSON.stringify(settings));
    toast({
      title: "Paramètres sauvegardés",
      description: "Les paramètres de sécurité ont été mis à jour.",
    });
  };

  const auditSecurityIssues = () => {
    const issues: string[] = [];
    
    // Vérifier si localStorage est encore utilisé pour l'authentification
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
      issues.push("Système d'authentification localStorage détecté - migrer vers Supabase Auth");
    }

    if (issues.length > 0) {
      toast({
        title: "Problèmes de sécurité détectés",
        description: `${issues.length} problème(s) trouvé(s). Consultez la console pour plus de détails.`,
        variant: "destructive",
      });
      console.warn("Problèmes de sécurité:", issues);
    } else {
      toast({
        title: "Audit terminé",
        description: "Aucun problème de sécurité majeur détecté.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Sécurité améliorée:</strong> L'authentification est maintenant gérée par Supabase Auth. 
          La gestion des mots de passe admin se fait via l'interface utilisateur Supabase.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Paramètres de sécurité
          </CardTitle>
          <CardDescription>
            Configurez les règles de sécurité et les politiques d'authentification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mots de passe forts obligatoires</Label>
              <p className="text-sm text-muted-foreground">
                Exiger des mots de passe complexes pour tous les utilisateurs (géré par Supabase)
              </p>
            </div>
            <Switch
              checked={settings.enforceStrongPasswords}
              onCheckedChange={(checked) => handleSettingChange("enforceStrongPasswords", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Délai d'expiration de session (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange("sessionTimeout", parseInt(e.target.value))}
              min="5"
              max="480"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxLoginAttempts">Nombre maximum de tentatives de connexion</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) => handleSettingChange("maxLoginAttempts", parseInt(e.target.value))}
              min="3"
              max="10"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Changement de mot de passe obligatoire</Label>
              <p className="text-sm text-muted-foreground">
                Forcer les utilisateurs à changer leur mot de passe périodiquement
              </p>
            </div>
            <Switch
              checked={settings.requirePasswordChange}
              onCheckedChange={(checked) => handleSettingChange("requirePasswordChange", checked)}
            />
          </div>

          {settings.requirePasswordChange && (
            <div className="space-y-2">
              <Label htmlFor="passwordExpirationDays">Expiration du mot de passe (jours)</Label>
              <Input
                id="passwordExpirationDays"
                type="number"
                value={settings.passwordExpirationDays}
                onChange={(e) => handleSettingChange("passwordExpirationDays", parseInt(e.target.value))}
                min="30"
                max="365"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Générateur de mot de passe sécurisé</CardTitle>
          <CardDescription>
            Générez des mots de passe sécurisés pour vos comptes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="generatedPassword">Mot de passe généré</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="generatedPassword"
                  type={showPassword ? "text" : "password"}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Cliquez sur 'Générer' pour créer un mot de passe sécurisé"
                  readOnly
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePassword}
                disabled={isGeneratingPassword}
              >
                {isGeneratingPassword ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Générer"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Le mot de passe généré contient 16 caractères avec majuscules, minuscules, chiffres et symboles
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={saveSettings}>
          Sauvegarder les paramètres
        </Button>
        <Button onClick={auditSecurityIssues} variant="outline">
          Audit de sécurité
        </Button>
      </div>
    </div>
  );
};

export default SecuritySettings;