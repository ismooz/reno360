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
import { AlertCircle, CheckCircle, Mail, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmailTemplates } from "@/types";

// NOTE: Initialisation du client Supabase.
const supabaseUrl = "https://fbkprtfdoeoazfgmsecm.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia3BydGZkb2VvYXpmZ21zZWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NjkzOTgsImV4cCI6MjA3MjI0NTM5OH0.cKfliAwLAH8eId-7mM9y3J6yi3ACmFPa9U4SQA87AHw";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// NOTE: Validation email locale
const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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
    body:
      "Bonjour {{name}},\n\nVotre compte a été créé avec succès sur reno360.ch.\n\nVous pouvez maintenant vous connecter et soumettre vos demandes de devis.\n\nCordialement,\nL'équipe reno360.ch",
  },
  password_change: {
    subject: "Modification de votre mot de passe",
    body:
      "Bonjour {{name}},\n\nVotre mot de passe a été modifié avec succès.\n\nSi vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement.\n\nCordialement,\nL'équipe reno360.ch",
  },
  account_closure: {
    subject: "Fermeture de votre compte",
    body:
      "Bonjour {{name}},\n\nVotre compte a été fermé comme demandé.\n\nVos données personnelles seront supprimées conformément à notre politique de confidentialité.\n\nCordialement,\nL'équipe reno360.ch",
  },
  account_deletion: {
    subject: "Suppression de votre compte",
    body:
      "Bonjour {{name}},\n\nVotre compte et toutes vos données ont été supprimés définitivement.\n\nCordialement,\nL'équipe reno360.ch",
  },
  request_status_change: {
    subject: "Mise à jour de votre demande de devis",
    body:
      'Bonjour {{name}},\n\nLe statut de votre demande "{{renovationType}}" a été modifié : {{status}}\n\nVous pouvez consulter les détails dans votre espace client.\n\nCordialement,\nL\'équipe reno360.ch',
  },
};

const EmailSettings = () => {
  const [config, setConfig] = useState<EmailConfig>({
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_pass: "",
    smtp_from: "",
    smtp_tls: true,
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
  const [secretsStatus, setSecretsStatus] = useState<Record<string, boolean> | null>(null);
  const [checkingSecrets, setCheckingSecrets] = useState(false);

  // AU CHARGEMENT: Lire la configuration depuis la table Supabase
  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from("smtp_config").select("*").eq("id", 1).single();

      if (error && error.code !== "PGRST116") {
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
    const savedReply = localStorage.getItem("replyToEmail");
    if (savedReply) setReplyToEmail(savedReply);
    const savedRequests = localStorage.getItem("requestsEmail");
    if (savedRequests) setRequestsEmail(savedRequests);
  }, [toast]);

  const handleTemplateChange = (type: keyof EmailTemplates, field: "subject" | "body", value: string) => {
    setTemplates((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  // Sauvegarde dans 'smtp_config'
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
      from_address: config.smtp_from,
      use_tls: config.smtp_tls,
    };

    const { error } = await supabase.from("smtp_config").upsert(updates);

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
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: testEmail,
          subject: "Test de configuration email - Reno360",
          html: `<p>Si vous recevez cet email, votre configuration SMTP fonctionne !</p>`,
        },
      });

      if (error) {
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

  const checkSecrets = async () => {
    setCheckingSecrets(true);
    setSecretsStatus(null);
    try {
      const { data, error } = await supabase.functions.invoke("email-secrets-status");
      if (error) throw error;
      setSecretsStatus((data as any)?.status ?? null);
      toast({ title: "Secrets vérifiés", description: "Statut mis à jour." });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Impossible de vérifier les secrets", variant: "destructive" });
    } finally {
      setCheckingSecrets(false);
    }
  };

  const templateLabels = {
    account_creation: "Création de compte",
    password_change: "Changement de mot de passe",
    account_closure: "Fermeture de compte",
    account_deletion: "Suppression de compte",
    request_status_change: "Changement de statut de demande",
  };

  // Classe commune pour les triggers (évite les retours à la ligne + shrink)
  const triggerBase =
    "px-3 py-2 text-sm whitespace-nowrap flex-shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm";

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-3 min-w-0">
      <Tabs defaultValue="smtp-config">
        {/* Onglets principaux */}
        <TabsList className="flex w-full gap-2 overflow-x-auto no-scrollbar rounded-md p-1 bg-muted/40 min-w-0">
          <TabsTrigger value="smtp-config" className={triggerBase}>
            Configuration SMTP
          </TabsTrigger>
          <TabsTrigger value="templates" className={triggerBase}>
            Templates
          </TabsTrigger>
          <TabsTrigger value="test" className={triggerBase}>
            Test Email
          </TabsTrigger>
        </TabsList>

        {/* Onglet: Configuration SMTP */}
        <TabsContent value="smtp-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuration SMTP
              </CardTitle>
              <CardDescription>
                Configurez les paramètres de votre serveur email pour l&apos;envoi automatique de notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="smtp_host">Serveur SMTP</Label>
                  <Input
                    id="smtp_host"
                    value={config.smtp_host}
                    onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="smtp_port">Port</Label>
                  <Input
                    id="smtp_port"
                    value={config.smtp_port}
                    onChange={(e) => setConfig({ ...config, smtp_port: e.target.value })}
                    placeholder="587"
                    type="number"
                  />
                </div>
              </div>

              <div className="space-y-2 min-w-0">
                <Label htmlFor="smtp_user">Nom d&apos;utilisateur</Label>
                <Input
                  id="smtp_user"
                  value={config.smtp_user}
                  onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                  placeholder="votre-email@gmail.com"
                  type="email"
                />
              </div>

               <Alert>
                 <AlertDescription>
                   Les identifiants SMTP (hôte, utilisateur, mot de passe) sont désormais gérés via des Secrets Supabase et ne sont jamais stockés en base.
                 </AlertDescription>
               </Alert>
               <div className="flex items-center gap-2">
                 <Button onClick={checkSecrets} variant="outline" disabled={checkingSecrets}>
                   {checkingSecrets ? "Vérification..." : "Vérifier les secrets"}
                 </Button>
               </div>
               {secretsStatus && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   {Object.entries(secretsStatus).map(([key, ok]) => (
                     <div key={key} className="flex items-center gap-2 text-sm">
                       {ok ? (
                         <CheckCircle className="h-4 w-4 text-green-600" />
                       ) : (
                         <AlertCircle className="h-4 w-4 text-red-600" />
                       )}
                       <span>{key}: {ok ? 'OK' : 'Manquant'}</span>
                     </div>
                   ))}
                 </div>
               )}

              <div className="space-y-2 min-w-0">
                <Label htmlFor="smtp_from">Email expéditeur</Label>
                <Input
                  id="smtp_from"
                  value={config.smtp_from}
                  onChange={(e) => setConfig({ ...config, smtp_from: e.target.value })}
                  placeholder="noreply@reno360.ch"
                  type="email"
                  className={emailErrors.smtp_from ? "border-destructive" : ""}
                />
                {emailErrors.smtp_from && <p className="text-sm text-destructive">{emailErrors.smtp_from}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smtp_tls"
                  checked={config.smtp_tls}
                  onCheckedChange={(checked) => setConfig({ ...config, smtp_tls: checked })}
                />
                <Label htmlFor="smtp_tls">Utiliser TLS/SSL</Label>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="replyToEmail">Adresse de réponse</Label>
                  <Input
                    id="replyToEmail"
                    value={replyToEmail}
                    onChange={(e) => setReplyToEmail(e.target.value)}
                    placeholder="contact@reno360.ch"
                    className={emailErrors.replyToEmail ? "border-destructive" : ""}
                  />
                  {emailErrors.replyToEmail && <p className="text-sm text-destructive">{emailErrors.replyToEmail}</p>}
                </div>

                <div className="space-y-2 min-w-0">
                  <Label htmlFor="requestsEmail">Email de réception des demandes</Label>
                  <Input
                    id="requestsEmail"
                    value={requestsEmail}
                    onChange={(e) => setRequestsEmail(e.target.value)}
                    placeholder="demandes@reno360.ch"
                    className={emailErrors.requestsEmail ? "border-destructive" : ""}
                  />
                  {emailErrors.requestsEmail && (
                    <p className="text-sm text-destructive">{emailErrors.requestsEmail}</p>
                  )}
                </div>
              </div>

              <Button onClick={saveConfig} disabled={isLoading} className="w-full">
                {isLoading ? "Chargement..." : "💾 Sauvegarder la configuration"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet: Templates */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates d&apos;emails</CardTitle>
              <CardDescription>
                Personnalisez les messages envoyés aux clients. Utilisez les variables: nom, type de rénovation, statut.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="account_creation">
                <div className="w-full mb-4 min-w-0">
                  <TabsList className="flex w-full gap-2 overflow-x-auto no-scrollbar h-auto p-1 bg-muted rounded-md min-w-0">
                    {Object.keys(templateLabels).map((key) => (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="text-xs sm:text-sm px-3 py-2 h-auto text-center whitespace-nowrap flex-shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
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
                        onChange={(e) => handleTemplateChange(key as keyof EmailTemplates, "subject", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${key}-body`}>Corps du message</Label>
                      <Textarea
                        id={`${key}-body`}
                        value={templates[key as keyof EmailTemplates].body}
                        onChange={(e) => handleTemplateChange(key as keyof EmailTemplates, "body", e.target.value)}
                        rows={10}
                        className="min-h-[180px] sm:min-h-[240px] resize-y font-mono text-sm leading-relaxed"
                      />
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                          <div>
                            <strong>Variables disponibles:</strong> {"{{name}}, {{renovationType}}, {{status}}"}
                          </div>
                          <div>
                            <strong>Exemple:</strong> Bonjour {"{{name}}"}, votre demande de {"{{renovationType}}"} a été{" "}
                            {"{{status}}"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet: Test */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Test de configuration
              </CardTitle>
              <CardDescription>
                Testez votre configuration en envoyant un email de test. En cas d&apos;erreur, pensez à consulter les
                logs de votre fonction sur le tableau de bord Supabase.
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

              <Button onClick={testEmailConfig} disabled={isTestingEmail || !testEmail} variant="outline" className="w-full">
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
