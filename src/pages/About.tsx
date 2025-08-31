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
          <h1 className="text-4xl font-bold mb-4">À Propos de reno360.ch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Votre artisan de confiance pour tous vos projets de rénovation
          </p>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Qui sommes-nous?</h2>
            <p className="text-lg mb-4 text-muted-foreground">
              reno360.ch est une entreprise suisse spécialisée dans la rénovation de biens immobiliers. Nous gérons votre projet de A à Z avec nos propres équipes qualifiées.
            </p>
            <p className="text-lg mb-4 text-muted-foreground">
              Fondée en 2023, notre mission est de simplifier le processus de rénovation en offrant un service transparent, fiable et de haute qualité à nos clients.
            </p>
            <p className="text-lg mb-4 text-muted-foreground">
              Nos équipes d'artisans expérimentés couvrent toute la Suisse et maîtrisent une large gamme de services, de la peinture à l'électricité, en passant par la plomberie et l'isolation.
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
                Nous nous engageons à fournir des services de rénovation de la plus haute qualité, réalisés par nos professionnels expérimentés et qualifiés.
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
                Nous nous engageons à respecter les délais et les budgets convenus, pour une expérience de rénovation sans stress.
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
                <h3 className="text-2xl font-semibold mb-4">Notre Processus</h3>
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
                      <p className="font-medium">Recevez notre devis</p>
                      <p className="text-muted-foreground">
                        Nous étudions votre projet et vous envoyons une proposition détaillée et transparente.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Validez le projet</p>
                      <p className="text-muted-foreground">
                        Une fois le devis accepté, nous planifions ensemble le déroulement des travaux.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Profitez de votre bien rénové</p>
                      <p className="text-muted-foreground">
                        Nos équipes réalisent les travaux selon les termes convenus et dans les délais.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4">Nos domaines d'expertise</h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Gros Œuvre & Maçonnerie</p>
                      <p className="text-muted-foreground">
                        Fondations, murs, dalles... nous assurons la solidité et la pérennité de votre structure.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Second Œuvre & Finitions</p>
                      <p className="text-muted-foreground">
                        Plomberie, électricité, plâtrerie, peinture... nous garantissons des finitions impeccables.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Rénovation Énergétique</p>
                      <p className="text-muted-foreground">
                        Isolation, fenêtres, systèmes de chauffage... améliorez votre confort et votre efficacité.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Aménagements Extérieurs</p>
                      <p className="text-muted-foreground">
                        Terrasses, façades, clôtures... nous embellissons aussi les abords de votre propriété.
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
            Faites confiance à reno360.ch pour vous accompagner dans toutes les étapes de votre projet.
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