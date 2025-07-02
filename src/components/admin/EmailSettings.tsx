
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplates } from "@/types";

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
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplates>(defaultTemplates);
  const [fromEmail, setFromEmail] = useState("noreply@reno360.ch");
  const [replyToEmail, setReplyToEmail] = useState("contact@reno360.ch");

  useEffect(() => {
    // Charger les paramètres depuis localStorage
    const savedTemplates = localStorage.getItem("emailTemplates");
    const savedFromEmail = localStorage.getItem("fromEmail");
    const savedReplyToEmail = localStorage.getItem("replyToEmail");

    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
    if (savedFromEmail) {
      setFromEmail(savedFromEmail);
    }
    if (savedReplyToEmail) {
      setReplyToEmail(savedReplyToEmail);
    }
  }, []);

  const handleTemplateChange = (type: keyof EmailTemplates, field: 'subject' | 'body', value: string) => {
    setTemplates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    localStorage.setItem("emailTemplates", JSON.stringify(templates));
    localStorage.setItem("fromEmail", fromEmail);
    localStorage.setItem("replyToEmail", replyToEmail);
    
    toast({
      title: "Paramètres sauvegardés",
      description: "Les paramètres d'email ont été mis à jour.",
    });
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
      <Card>
        <CardHeader>
          <CardTitle>Paramètres d'envoi</CardTitle>
          <CardDescription>
            Configurez les adresses email utilisées pour l'envoi des notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fromEmail">Adresse d'expédition</Label>
            <Input
              id="fromEmail"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="noreply@reno360.ch"
            />
          </div>
          <div>
            <Label htmlFor="replyToEmail">Adresse de réponse</Label>
            <Input
              id="replyToEmail"
              value={replyToEmail}
              onChange={(e) => setReplyToEmail(e.target.value)}
              placeholder="contact@reno360.ch"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates d'emails</CardTitle>
          <CardDescription>
            Personnalisez les messages envoyés aux clients. Utilisez les variables: nom, type de rénovation, statut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="account_creation">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              {Object.keys(templateLabels).map((key) => (
                <TabsTrigger key={key} value={key} className="text-xs">
                  {templateLabels[key as keyof typeof templateLabels]}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.entries(templateLabels).map(([key, label]) => (
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
                    rows={8}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Sauvegarder les paramètres
        </Button>
      </div>
    </div>
  );
};

export default EmailSettings;
