import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SearchBar from "@/components/search/SearchBar";
import { getCustomServices } from "@/utils/serviceUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { RenovationType } from "@/types";
import { HeroBackground } from "@/components/ui/hero-background";
const Index = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<RenovationType[]>([]);
  useEffect(() => {
    const customServices = getCustomServices();
    setServices(customServices);
  }, []);
  const handleServiceClick = (serviceId: string) => {
    navigate(`/formulaire?renovation=${encodeURIComponent(serviceId)}`);
  };
  return <Layout>
      {/* Hero Section */}
      <HeroBackground>
        <div className="container mx-auto text-center px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">Solutions de rénovation et de travaux pour votre propriété</h1>
          <p className="text-lg sm:text-xl text-white/90 mb-8 sm:mb-12 max-w-3xl mx-auto">Du travail de qualité pour tous vos projets de rénovation et de travaux</p>
          
          <div className="flex justify-center px-4 sm:px-8">
            <SearchBar fullWidth className="w-full" />
          </div>
        </div>
      </HeroBackground>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-2 text-center">Nos services de rénovation</h2>
          <p className="text-center text-muted-foreground mb-12">
            Des solutions complètes pour tous vos besoins en rénovation
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.slice(0, 9).map(service => <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{service.icon}</span>
                    <h3 className="text-xl font-semibold">{service.name}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {service.description}
                  </p>
                  <Button variant="outline" className="mt-2" onClick={() => handleServiceClick(service.id)}>
                    Demander un devis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>)}
          </div>
          
          <div className="text-center mt-12">
            <Button onClick={() => navigate("/services")}>
              Voir tous nos services
            </Button>
          </div>
        </div>
      </section>

      {/* Comment ça marche Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-2 text-center">Comment ça marche</h2>
          <p className="text-center text-muted-foreground mb-12">
            Un processus simple pour votre projet de rénovation
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Demandez un devis</h3>
              <p className="text-muted-foreground">
                Remplissez notre formulaire en ligne avec les détails de votre projet de rénovation.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Recevez des propositions</h3>
              <p className="text-muted-foreground">
                Nos professionnels qualifiés vous envoient leurs propositions adaptées à vos besoins.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Réalisez vos travaux</h3>
              <p className="text-muted-foreground">
                Choisissez l'offre qui vous convient et faites réaliser vos travaux en toute sérénité.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à transformer votre propriété?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Faites appel à nos experts en rénovation pour donner vie à vos projets immobiliers.
          </p>
          <Button size="lg" onClick={() => navigate("/contact")}>
            Demander un devis gratuit
          </Button>
        </div>
      </section>
    </Layout>;
};
export default Index;