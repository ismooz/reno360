
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const Confirmation = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Demande envoyée avec succès!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Merci pour votre demande de devis. Nous l'avons bien reçue et nous vous
            contacterons dans les plus brefs délais.
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full"
            >
              Voir mes demandes
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Confirmation;
