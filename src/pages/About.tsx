
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-4xl font-bold mb-4">À Propos de RENOVO.ch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Votre partenaire de confiance pour tous vos projets de rénovation immobilière
          </p>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Qui sommes-nous?</h2>
            <p className="text-lg mb-4 text-muted-foreground">
              reno360.ch est une entreprise suisse spécialisée dans la mise en relation entre propriétaires de biens immobiliers et professionnels qualifiés de la rénovation.
            </p>
            <p className="text-lg mb-4 text-muted-foreground">
              Fondée en 2023, notre mission est de simplifier le processus de rénovation en offrant un service transparent, fiable et de haute qualité à nos clients.
            </p>
            <p className="text-lg mb-4 text-muted-foreground">
              Notre réseau d'entreprises sélectionnées couvre toute la Suisse et offre une large gamme de services de rénovation, de la peinture à l'électricité, en passant par la plomberie et l'isolation.
            </p>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">Nos valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <h3 className="text-xl font-semibold mb-3">Qualité</h3>
              <p className="text-muted-foreground">
                Nous nous engageons à fournir des services de rénovation de la plus haute qualité, réalisés par des professionnels expérimentés et qualifiés.
              </p>
            </div>
            
            <div className="text-center p-6">
              <h3 className="text-xl font-semibold mb-3">Transparence</h3>
              <p className="text-muted-foreground">
                Nous croyons en une communication claire et honnête, avec des devis détaillés et sans frais cachés.
              </p>
            </div>
            
            <div className="text-center p-6">
              <h3 className="text-xl font-semibold mb-3">Fiabilité</h3>
              <p className="text-muted-foreground">
                Nos partenaires respectent les délais et les budgets, pour une expérience de rénovation sans stress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">Comment ça marche?</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold mb-4">Pour les clients</h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Exprimez votre besoin</p>
                      <p className="text-muted-foreground">
                        Remplissez notre formulaire en ligne avec les détails de votre projet de rénovation.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Recevez des devis</p>
                      <p className="text-muted-foreground">
                        Des professionnels qualifiés vous envoient leurs propositions adaptées à vos besoins.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Choisissez votre prestataire</p>
                      <p className="text-muted-foreground">
                        Comparez les offres et sélectionnez le professionnel qui vous convient le mieux.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Réalisez vos travaux</p>
                      <p className="text-muted-foreground">
                        Le professionnel réalise les travaux selon les termes convenus.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4">Pour les professionnels</h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Rejoignez notre réseau</p>
                      <p className="text-muted-foreground">
                        Inscrivez-vous à notre plateforme et présentez vos qualifications et spécialités.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Recevez des demandes</p>
                      <p className="text-muted-foreground">
                        Accédez aux projets de rénovation correspondant à vos compétences et votre zone géographique.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Proposez vos devis</p>
                      <p className="text-muted-foreground">
                        Envoyez vos propositions personnalisées aux clients intéressés.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Développez votre activité</p>
                      <p className="text-muted-foreground">
                        Réalisez les projets et obtenez des évaluations positives pour développer votre réputation.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à commencer votre projet de rénovation?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Faites confiance à RENOVO.ch pour vous accompagner dans toutes les étapes de votre projet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/formulaire")}>
              Demander un devis
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact")}>
              Nous contacter
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
