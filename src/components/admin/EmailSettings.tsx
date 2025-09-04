import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Mail, Send, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmailTemplates } from "@/types";

// NOTE: Initialisation du client Supabase.
// Remplacez les valeurs ci-dessous par vos variables d'environnement.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "VOTRE_URL_SUPABASE";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "VOTRE_CLE_ANON_SUPABASE";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// NOTE: La fonction de validation a été intégrée directement ici pour résoudre le problème d'importation.
const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};


interface EmailConfig {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  smtp_tls: boolean;
}

const defaultTemplates: EmailTemplates = {
  account_creation: {
    subject: "Bienvenue sur reno360.ch",
    body: "Bonjour {{name}},\n\nVotre compte a été créé avec succès sur reno360.ch.\n\nVous pouvez maintenant vous connecter et soumettre vos demandes de devis.\n\nCordialement,\nL'équipe reno360.ch"
  },
  password_change: {
    subject: "Modification de votre mot de passe",
    body: "Bonjour {{name}},\n\nVotre mot de passe a été modifié avec succès.\n\nSi vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement.\n\nCordialement,\nL'équipe reno360.ch"
  },
  account_closure: {
    subject: "Fermeture de votre compte",
    body: "Bonjour {{name}},\n\nVotre compte a été fermé comme demandé.\n\nVos données personnelles seront supprimées conformément à notre politique de confidentialité.\n\nCordialement,\nL'équipe reno360.ch"
  },
  account_deletion: {
    subject: "Suppression de votre compte",
    body: "Bonjour {{name}},\n\nVotre compte et toutes vos données ont été supprimés définitivement.\n\nCordialement,\nL'équipe reno360.ch"
  },
  request_status_change: {
    subject: "Mise à jour de votre demande de devis",
    body: "Bonjour {{name}},\n\nLe statut de votre demande \"{{renovationType}}\" a été modifié : {{status}}\n\nVous pouvez consulter les détails dans votre espace client.\n\nCordialement,\nL'équipe reno360.ch"
  }
};

const EmailSettings = () => {
  const [config, setConfig] = useState<EmailConfig>({
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_pass: "",
    smtp_from: "",
    smtp_tls: true
  });
  const [templates, setTemplates] = useState<EmailTemplates>(defaultTemplates);
  const [replyToEmail, setReplyToEmail] = useState("contact@reno360.ch");
  const [requestsEmail, setRequestsEmail] = useState("demandes@reno360.ch");
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // AU CHARGEMENT: Lire la configuration depuis la table Supabase
  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('smtp_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erreur de chargement de la config SMTP:", error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger la configuration SMTP depuis la base de données.",
          variant: "destructive",
        });
      } else if (data) {
        setConfig({
          smtp_host: data.host || "",
          smtp_port: data.port?.toString() || "587",
          smtp_user: data.username || "",
          smtp_pass: data.password || "",
          smtp_from: data.from_address || "",
          smtp_tls: data.use_tls ?? true,
        });
      }
      setIsLoading(false);
    };

    fetchConfig();
    
    const savedTemplates = localStorage.getItem("emailTemplates");
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, [toast]);

  const handleTemplateChange = (type: keyof EmailTemplates, field: 'subject' | 'body', value: string) => {
    setTemplates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  // MODIFIÉ: La sauvegarde se fait dans la table 'smtp_config'
  const saveConfig = async () => {
    setIsLoading(true);
    const errors: Record<string, string> = {};
    if (!validateEmail(config.smtp_from)) {
      errors.smtp_from = "Format d'email invalide";
    }
    if (!validateEmail(replyToEmail)) {
        errors.replyToEmail = "Format d'email invalide";
    }
    if (!validateEmail(requestsEmail)) {
        errors.requestsEmail = "Format d'email invalide";
    }
    
    if (Object.keys(errors).length > 0) {
      setEmailErrors(errors);
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    setEmailErrors({});

    const updates = {
      id: 1,
      host: config.smtp_host,
      port: parseInt(config.smtp_port, 10),
      username: config.smtp_user,
      password: config.smtp_pass,
      from_address: config.smtp_from,
      use_tls: config.smtp_tls,
    };

    const { error } = await supabase.from('smtp_config').upsert(updates);

    if (error) {
      console.error("Erreur de sauvegarde:", error);
      toast({
        title: "Erreur de sauvegarde",
        description: `Impossible de sauvegarder la configuration: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "✅ Configuration sauvegardée",
        description: "Votre configuration SMTP a été mise à jour.",
      });
      localStorage.setItem("emailTemplates", JSON.stringify(templates));
      localStorage.setItem("replyToEmail", replyToEmail);
      localStorage.setItem("requestsEmail", requestsEmail);
    }

    setIsLoading(false);
  };

  const testEmailConfig = async () => {
    if (!validateEmail(testEmail)) {
      toast({
        title: "Email de test invalide",
        description: "Veuillez saisir une adresse email valide.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingEmail(true);
    setTestResult(null);

    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: "Test de configuration email - Reno360",
          html: `<p>Si vous recevez cet email, votre configuration SMTP fonctionne !</p>`,
        }
      });

      if (error) {
        // AMÉLIORATION: Essayer d'extraire un message d'erreur plus détaillé de la réponse de la fonction
        const detailedMessage = (error as any).context?.error?.message || error.message;
        setTestResult({ success: false, message: `Erreur: ${detailedMessage}` });
        toast({ title: "Test échoué", description: `Détail: ${detailedMessage}`, variant: "destructive" });
      } else {
        setTestResult({ success: true, message: "Email de test envoyé avec succès !" });
        toast({ title: "Test réussi", description: "Vérifiez votre boîte de réception." });
      }
    } catch (e: any) {
      const errorMessage = e.message || "Une erreur inconnue est survenue.";
      setTestResult({ success: false, message: `Erreur: ${errorMessage}` });
      toast({ title: "Erreur de test", description: `Impossible d'invoquer la fonction: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const templateLabels = {
    account_creation: "Création de compte",
    password_change: "Changement de mot de passe",
    account_closure: "Fermeture de compte",
    account_deletion: "Suppression de compte",
    request_status_change: "Changement de statut de demande"
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="smtp-config">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="smtp-config">Configuration SMTP</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="test">Test Email</TabsTrigger>
        </TabsList>
        
        <TabsContent value="smtp-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuration SMTP
              </CardTitle>
              <CardDescription>
                Configurez les paramètres de votre serveur email pour l'envoi automatique de notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">Serveur SMTP</Label>
                  <Input id="smtp_host" value={config.smtp_host} onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })} placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Port</Label>
                  <Input id="smtp_port" value={config.smtp_port} onChange={(e) => setConfig({ ...config, smtp_port: e.target.value })} placeholder="587" type="number" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_user">Nom d'utilisateur</Label>
                <Input id="smtp_user" value={config.smtp_user} onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })} placeholder="votre-email@gmail.com" type="email" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_pass">Mot de passe</Label>
                <Input id="smtp_pass" value={config.smtp_pass} onChange={(e) => setConfig({ ...config, smtp_pass: e.target.value })} placeholder="Mot de passe d'application" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_from">Email expéditeur</Label>
                <Input id="smtp_from" value={config.smtp_from} onChange={(e) => setConfig({ ...config, smtp_from: e.target.value })} placeholder="noreply@reno360.ch" type="email" className={emailErrors.smtp_from ? "border-destructive" : ""} />
                {emailErrors.smtp_from && (<p className="text-sm text-destructive">{emailErrors.smtp_from}</p>)}
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="smtp_tls" checked={config.smtp_tls} onCheckedChange={(checked) => setConfig({ ...config, smtp_tls: checked })} />
                <Label htmlFor="smtp_tls">Utiliser TLS/SSL</Label>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="replyToEmail">Adresse de réponse</Label>
                  <Input id="replyToEmail" value={replyToEmail} onChange={(e) => setReplyToEmail(e.target.value)} placeholder="contact@reno360.ch" className={emailErrors.replyToEmail ? "border-destructive" : ""} />
                   {emailErrors.replyToEmail && (<p className="text-sm text-destructive">{emailErrors.replyToEmail}</p>)}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="requestsEmail">Email de réception des demandes</Label>
                  <Input id="requestsEmail" value={requestsEmail} onChange={(e) => setRequestsEmail(e.target.value)} placeholder="demandes@reno360.ch" className={emailErrors.requestsEmail ? "border-destructive" : ""} />
                  {emailErrors.requestsEmail && (<p className="text-sm text-destructive">{emailErrors.requestsEmail}</p>)}
                </div>
              </div>

              <Button onClick={saveConfig} disabled={isLoading} className="w-full">
                {isLoading ? "Chargement..." : "💾 Sauvegarder la configuration"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates d'emails</CardTitle>
              <CardDescription>
                Personnalisez les messages envoyés aux clients. Utilisez les variables: nom, type de rénovation, statut.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="account_creation">
                <div className="w-full overflow-x-auto mb-4">
                  <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-1 h-auto p-1 bg-muted">
                    {Object.keys(templateLabels).map((key) => (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="text-xs sm:text-sm px-2 py-2 h-auto text-center whitespace-normal break-words data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                      >
                        {templateLabels[key as keyof typeof templateLabels]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                {Object.entries(templateLabels).map(([key]) => (
                  <TabsContent key={key} value={key} className="space-y-4">
                    <div>
                      <Label htmlFor={`${key}-subject`}>Sujet</Label>
                      <Input
                        id={`${key}-subject`}
                        value={templates[key as keyof EmailTemplates].subject}
                        onChange={(e) => handleTemplateChange(key as keyof EmailTemplates, 'subject', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${key}-body`}>Corps du message</Label>
                      <Textarea
                        id={`${key}-body`}
                        value={templates[key as keyof EmailTemplates].body}
                        onChange={(e) => handleTemplateChange(key as keyof EmailTemplates, 'body', e.target.value)}
                        rows={10}
                        className="min-h-[200px] sm:min-h-[250px] resize-y font-mono text-sm leading-relaxed"
                      />
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                          <div><strong>Variables disponibles:</strong> {"{{name}}, {{renovationType}}, {{status}}"}</div>
                          <div><strong>Exemple:</strong> Bonjour {"{{name}}"}, votre demande de {"{{renovationType}}"} a été {"{{status}}"}</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Test de configuration
              </CardTitle>
              <CardDescription>
                Testez votre configuration en envoyant un email de test. 
                En cas d'erreur, pensez à consulter les logs de votre fonction sur le tableau de bord Supabase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test_email">Email de test</Label>
                <Input
                  id="test_email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  type="email"
                />
              </div>

              <Button
                onClick={testEmailConfig}
                disabled={isTestingEmail || !testEmail}
                variant="outline"
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isTestingEmail ? "Envoi en cours..." : "Envoyer un email de test"}
              </Button>

              {testResult && (
                <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                      {testResult.message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailSettings;

