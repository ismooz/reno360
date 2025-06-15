
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { renovationTypes, getRenovationCategories, getRenovationsByCategory } from "@/data/renovationTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

const Services = () => {
  const navigate = useNavigate();
  const categories = ["Toutes", ...getRenovationCategories()];
  const [activeCategory, setActiveCategory] = useState("Toutes");
  
  const handleServiceClick = (serviceId: string) => {
    navigate(`/formulaire?renovation=${encodeURIComponent(serviceId)}`);
  };

  const getDisplayedServices = () => {
    if (activeCategory === "Toutes") {
      return renovationTypes;
    }
    return getRenovationsByCategory(activeCategory);
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

      {/* Catégories Section */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          {/* Mobile: Dropdown */}
          <div className="md:hidden mb-8">
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Tabs */}
          <Tabs 
            defaultValue="Toutes" 
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="w-full hidden md:block"
          >
            <div className="flex justify-center mb-8">
              <TabsList className="inline-flex">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category} 
                    className="px-4 py-2 text-sm whitespace-nowrap"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {getDisplayedServices().map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                  <p className="text-muted-foreground mb-4">
                    {service.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {service.category}
                    </span>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => handleServiceClick(service.id)}
                    >
                      Demander un devis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
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
