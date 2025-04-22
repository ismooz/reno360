
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";

const Confirmation = () => {
  const navigate = useNavigate();

  // Générer un numéro de référence aléatoire
  const referenceNumber = `REF-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <Layout>
      <div className="container py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mb-6 flex justify-center">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold mb-2">Demande envoyée avec succès!</CardTitle>
              <CardDescription className="text-lg">
                Votre référence: <span className="font-bold">{referenceNumber}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Merci pour votre demande de devis. Nous l'avons bien reçue et nous vous
                  contacterons dans les plus brefs délais.
                </p>
                <p className="text-sm text-muted-foreground">
                  Un e-mail de confirmation a été envoyé à l'adresse fournie avec un récapitulatif
                  de votre demande. Vous pouvez suivre l'avancement de votre demande dans votre espace client.
                </p>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="w-full"
                >
                  Voir mes demandes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Confirmation;
