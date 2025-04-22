
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dans une application réelle, envoyez les données au backend
    console.log("Contact form submitted:", formData);
    // Simuler l'envoi réussi
    setTimeout(() => {
      setIsSubmitted(true);
    }, 500);
  };
  
  if (isSubmitted) {
    return (
      <Layout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Message envoyé!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Merci pour votre message. Notre équipe vous contactera très prochainement.
            </p>
            <Button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({ name: "", email: "", phone: "", message: "" });
              }}
              className="w-full"
            >
              Envoyer un autre message
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold mb-4">Contactez-nous</h1>
              <p className="text-muted-foreground mb-6">
                Vous avez des questions sur nos services de rénovation? 
                N'hésitez pas à nous contacter pour discuter de votre projet.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Adresse</h3>
                  <p className="text-muted-foreground">
                    Avenue de la Rénovation 123<br />
                    1200 Genève, Suisse
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Téléphone</h3>
                  <p className="text-muted-foreground">+41 800 123 456</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Email</h3>
                  <p className="text-muted-foreground">info@renovo.ch</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Horaires</h3>
                  <p className="text-muted-foreground">
                    Lundi - Vendredi: 8h00 - 18h00<br />
                    Samedi: 9h00 - 16h00<br />
                    Dimanche: Fermé
                  </p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Envoyez-nous un message</CardTitle>
                  <CardDescription>
                    Complétez le formulaire ci-dessous et nous vous répondrons dans les meilleurs délais.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Jean Dupont"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="jean.dupont@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+41 XX XXX XX XX"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Décrivez votre projet ou posez-nous vos questions..."
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <Alert>
                      <AlertDescription>
                        En soumettant ce formulaire, vous acceptez que vos données soient traitées conformément à notre politique de confidentialité.
                      </AlertDescription>
                    </Alert>
                    
                    <Button type="submit" className="w-full">
                      Envoyer le message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
