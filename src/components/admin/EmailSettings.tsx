import { useState, useEffect } from "react";
import DOMPurify from "dompurify";

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
    body: `
      <h2>Bienvenue sur reno360.ch</h2>
      <p>Bonjour <strong>{{name}}</strong>,</p>
      <p>Votre compte a été créé avec succès sur reno360.ch.</p>
      <p>Vous pouvez maintenant vous connecter et soumettre vos demandes de devis.</p>
      <br>
      <p>Cordialement,<br>L'équipe reno360.ch</p>
    `,
  },
  password_change: {
    subject: "Modification de votre mot de passe",
    body: `
      <h2>Modification de mot de passe</h2>
      <p>Bonjour <strong>{{name}}</strong>,</p>
      <p>Votre mot de passe a été modifié avec succès.</p>
      <p style="color: #d97706;">Si vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement.</p>
      <br>
      <p>Cordialement,<br>L'équipe reno360.ch</p>
    `,
  },
  account_closure: {
    subject: "Fermeture de votre compte",
    body: `
      <h2>Fermeture de compte</h2>
      <p>Bonjour <strong>{{name}}</strong>,</p>
      <p>Votre compte a été fermé comme demandé.</p>
      <p>Vos données personnelles seront supprimées conformément à notre politique de confidentialité.</p>
      <br>
      <p>Cordialement,<br>L'équipe reno360.ch</p>
    `,
  },
  account_deletion: {
    subject: "Suppression de votre compte",
    body: `
      <h2>Suppression de compte</h2>
      <p>Bonjour <strong>{{name}}</strong>,</p>
      <p>Votre compte et toutes vos données ont été supprimés définitivement.</p>
      <br>
      <p>Cordialement,<br>L'équipe reno360.ch</p>
    `,
  },
  request_status_change: {
    subject: "Mise à jour de votre demande de devis",
    body: `
      <h2>Mise à jour de votre demande</h2>
      <p>Bonjour <strong>{{name}}</strong>,</p>
      <p>Le statut de votre demande "<em>{{renovationType}}</em>" a été modifié :</p>
      <p style="font-size: 18px; color: #059669;"><strong>{{status}}</strong></p>
      <p>Vous pouvez consulter les détails dans votre espace client.</p>
      <br>
      <p>Cordialement,<br>L'équipe reno360.ch</p>
    `,
  },
  client_request_received: {
    subject: "Confirmation de réception de votre demande",
    body: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #1f2937;">Demande reçue avec succès</h2>
        <p>Bonjour <strong>{{name}}</strong>,</p>
        <p>Nous avons bien reçu votre demande de devis pour : <strong>{{renovationType}}</strong></p>
        
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">📋 Numéro de demande :</h3>
          <p style="font-size: 18px; font-weight: bold; color: #1e40af; margin: 0;">{{requestId}}</p>
          <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;">Conservez ce numéro pour le suivi de votre demande</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Détails de votre demande :</h3>
          <p><strong>Type de rénovation :</strong> {{renovationType}}</p>
          <p><strong>Code postal :</strong> {{postalCode}}</p>
          <p><strong>Délai souhaité :</strong> {{deadline}}</p>
          <p><strong>Budget :</strong> {{budget}}</p>
          {{attachmentsSection}}
        </div>
        
        <p><strong>Notre équipe va examiner votre demande et vous recontacter dans les plus brefs délais.</strong></p>
        
        <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af;"><strong>💡 Conseil :</strong> Préparez vos questions et photos du projet pour faciliter notre évaluation.</p>
        </div>
        
        <p>Si vous avez des questions urgentes, n'hésitez pas à nous contacter en mentionnant votre numéro de demande.</p>
        <br>
        <p>Cordialement,<br><strong>L'équipe reno360.ch</strong></p>
      </div>
    `,
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

  // AU CHARGEMENT: Lire la configuration depuis localStorage
  useEffect(() => {
    const loadConfig = () => {
      setIsLoading(true);
      
      // Charger la configuration SMTP depuis localStorage (password excluded for security)
      const smtpHost = localStorage.getItem("smtpHost") || "";
      const smtpPort = localStorage.getItem("smtpPort") || "587";
      const smtpUser = localStorage.getItem("smtpUser") || "";
      // NOTE: Password is not stored in localStorage - use Supabase secrets
      const smtpPass = "";
      const smtpFrom = localStorage.getItem("smtpFrom") || "";
      const smtpTls = localStorage.getItem("smtpTls") !== "false";

      setConfig({
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
        smtp_from: smtpFrom,
        smtp_tls: smtpTls,
      });
      
      setIsLoading(false);
    };

    loadConfig();

    // Charger les templates avec fusion des défauts
    const savedTemplates = localStorage.getItem("emailTemplates");
    if (savedTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedTemplates);
        // Fusionner avec les templates par défaut pour s'assurer qu'aucun template ne manque
        setTemplates({
          ...defaultTemplates,
          ...parsedTemplates
        });
      } catch (error) {
        console.error("Erreur lors du parsing des templates:", error);
        setTemplates(defaultTemplates);
      }
    } else {
      setTemplates(defaultTemplates);
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

  // Sauvegarde dans 'smtp_config' et localStorage
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

    // Sauvegarder dans localStorage pour l'EmailService (excluding password for security)
    localStorage.setItem("smtpHost", config.smtp_host);
    localStorage.setItem("smtpPort", config.smtp_port);
    localStorage.setItem("smtpUser", config.smtp_user);
    // NOTE: SMTP password is NOT stored in localStorage for security reasons
    // It should only be configured via Supabase secrets (SMTP_PASS)
    localStorage.setItem("smtpFrom", config.smtp_from);
    localStorage.setItem("smtpTls", config.smtp_tls.toString());

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

    if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez configurer tous les paramètres SMTP avant de tester.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingEmail(true);
    setTestResult(null);

    try {
      const smtpConfig = {
        host: config.smtp_host,
        port: parseInt(config.smtp_port, 10),
        username: config.smtp_user,
        password: config.smtp_pass,
        from: config.smtp_from,
        useTLS: config.smtp_tls
      };

      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: testEmail,
          subject: "Test de configuration email - Reno360",
          html: `<p>Si vous recevez cet email, votre configuration SMTP fonctionne !</p>`,
          smtpConfig
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

  const checkConfiguration = async () => {
    if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
      setTestResult({ 
        success: false, 
        message: "Configuration incomplète. Veuillez remplir tous les champs SMTP." 
      });
      return;
    }

    setCheckingSecrets(true);
    setTestResult(null);
    
    try {
      const smtpConfig = {
        host: config.smtp_host,
        port: parseInt(config.smtp_port, 10),
        username: config.smtp_user,
        password: config.smtp_pass,
        from: config.smtp_from,
        useTLS: config.smtp_tls
      };

      // Test avec un email de validation interne
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: config.smtp_user, // Envoyer à soi-même pour test
          subject: "Test de configuration SMTP - Reno360",
          html: `<p>Configuration SMTP validée avec succès !</p>`,
          smtpConfig
        },
      });

      if (error) {
        const detailedMessage = (error as any).context?.error?.message || error.message;
        setTestResult({ 
          success: false, 
          message: `Configuration invalide: ${detailedMessage}` 
        });
      } else {
        setTestResult({ 
          success: true, 
          message: "Configuration SMTP validée avec succès !" 
        });
      }
    } catch (e: any) {
      setTestResult({ 
        success: false, 
        message: `Erreur de validation: ${e.message}` 
      });
    } finally {
      setCheckingSecrets(false);
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
    client_request_received: "Confirmation de demande client",
  };

  // Classe commune pour les triggers (évite les retours à la ligne + shrink)
  const triggerBase =
    "px-3 py-2 text-sm whitespace-nowrap flex-shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm";

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-3 min-w-0">
      <Tabs defaultValue="smtp-config">
        {/* Onglets principaux */}
        <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1 bg-muted/40">
          <TabsTrigger value="smtp-config" className="text-xs sm:text-sm px-2 py-2 h-auto text-center data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            SMTP
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs sm:text-sm px-2 py-2 h-auto text-center data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Templates
          </TabsTrigger>
          <TabsTrigger value="test" className="text-xs sm:text-sm px-2 py-2 h-auto text-center data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Test
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

              <div className="space-y-2 min-w-0">
                <Label htmlFor="smtp_pass">Mot de passe</Label>
                <Input
                  id="smtp_pass"
                  value={config.smtp_pass}
                  onChange={(e) => setConfig({ ...config, smtp_pass: e.target.value })}
                  placeholder="Votre mot de passe SMTP"
                  type="password"
                />
              </div>

              <Alert>
                <AlertDescription>
                  Configuration SMTP gérée depuis le dashboard admin. Utilisez le bouton de vérification pour tester votre configuration.
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center gap-2">
                <Button onClick={checkConfiguration} variant="outline" disabled={checkingSecrets}>
                  {checkingSecrets ? "Vérification..." : "Vérifier la configuration"}
                </Button>
              </div>
              
              {testResult && (
                <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${
                  testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{testResult.message}</span>
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
              <CardTitle>Templates d&apos;emails HTML</CardTitle>
              <CardDescription>
                Personnalisez les messages HTML envoyés aux clients. Variables disponibles : name, renovationType, status, postalCode, deadline, budget, requestId, attachmentsSection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="account_creation" className="w-full">
                <div className="w-full mb-4">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 h-auto p-1 bg-muted rounded-md">
                    {Object.keys(templateLabels).map((key) => (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="text-xs sm:text-sm px-2 py-2 text-center h-auto whitespace-normal leading-tight data-[state=active]:bg-background data-[state=active]:text-foreground"
                      >
                        <span className="block">
                          {templateLabels[key as keyof typeof templateLabels]}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {Object.entries(templateLabels).map(([key]) => {
                  const template = templates[key as keyof EmailTemplates];
                  if (!template) {
                    return null; // Skip if template doesn't exist
                  }
                  
                  return (
                  <TabsContent key={key} value={key} className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`${key}-subject`}>Sujet</Label>
                          <Input
                            id={`${key}-subject`}
                            value={template.subject}
                            onChange={(e) => handleTemplateChange(key as keyof EmailTemplates, "subject", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${key}-body`}>Corps du message (HTML)</Label>
                          <Textarea
                            id={`${key}-body`}
                            value={template.body}
                            onChange={(e) => handleTemplateChange(key as keyof EmailTemplates, "body", e.target.value)}
                            rows={12}
                            className="mt-1 min-h-[300px] resize-y font-mono text-sm leading-relaxed"
                            placeholder="Entrez votre template HTML ici..."
                          />
                        </div>
                        <div className="p-3 bg-blue-50 rounded-md text-sm">
                            <div className="text-blue-800">
                              <strong>Variables disponibles :</strong>
                              <div className="mt-1 space-y-1">
                                <div>• {`{{name}}`} - Nom du client</div>
                                <div>• {`{{renovationType}}`} - Type de rénovation</div>
                                <div>• {`{{status}}`} - Statut de la demande</div>
                                <div>• {`{{postalCode}}`} - Code postal</div>
                                <div>• {`{{deadline}}`} - Délai souhaité</div>
                                <div>• {`{{budget}}`} - Budget</div>
                                <div>• {`{{requestId}}`} - Numéro de demande</div>
                                <div>• {`{{attachmentsSection}}`} - Section des pièces jointes</div>
                              </div>
                            </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Aperçu du rendu</Label>
                          <div className="mt-1 border rounded-md p-4 bg-white min-h-[300px] max-h-[400px] overflow-y-auto">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: DOMPurify.sanitize(
                                  template.body
                                    .replace(/{{name}}/g, "Jean Dupont")
                                    .replace(/{{renovationType}}/g, "Cuisine")
                                    .replace(/{{status}}/g, "Approuvé")
                                    .replace(/{{postalCode}}/g, "1000")
                                    .replace(/{{deadline}}/g, "Dans 2 mois")
                                    .replace(/{{budget}}/g, "15'000 CHF")
                                    .replace(/{{requestId}}/g, "REQ-2025-001")
                                    .replace(/{{attachmentsSection}}/g, `
                                      <div style="margin-top: 15px;">
                                        <p><strong>📎 Pièces jointes :</strong></p>
                                        <ul style="margin: 10px 0; padding-left: 20px;">
                                          <li>Photo_cuisine_avant.jpg</li>
                                          <li>Plan_projet.pdf</li>
                                        </ul>
                                      </div>
                                    `)
                                )
                              }} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  );
                })}
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
