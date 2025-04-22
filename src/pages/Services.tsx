
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { renovationTypes } from "@/data/renovationTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const Services = () => {
  const navigate = useNavigate();
  
  const handleServiceClick = (serviceId: string) => {
    navigate(`/formulaire?renovation=${encodeURIComponent(serviceId)}`);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-4xl font-bold mb-4">Nos services de rénovation</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez l'ensemble de nos services de rénovation pour votre propriété
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {renovationTypes.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                  <p className="text-muted-foreground mb-4">
                    {service.description}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => handleServiceClick(service.id)}
                  >
                    Demander un devis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Besoin d'un service sur mesure?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Contactez-nous pour discuter de vos besoins spécifiques en matière de rénovation.
          </p>
          <Button size="lg" onClick={() => navigate("/contact")}>
            Nous contacter
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
