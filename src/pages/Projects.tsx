
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProjectCarousel from "@/components/projects/ProjectCarousel";
import BeforeAfterSlider from "@/components/projects/BeforeAfterSlider";
import { Project } from "@/types";
import { useNavigate } from "react-router-dom";

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Charger les projets depuis localStorage
    const storedProjects = localStorage.getItem("projects");
    if (storedProjects) {
      setProjects(JSON.parse(storedProjects));
    }
  }, []);

  const isAdmin = user?.role === "admin"; // Utilise la propriété role directement

  return (
    <Layout>
      <div className="container py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Nos réalisations</h1>
            {isAdmin && (
              <Button onClick={() => navigate("/projects/new")}>
                Ajouter une réalisation
              </Button>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Aucune réalisation disponible pour le moment.
              </p>
            </div>
          ) : (
            <div className="grid gap-12">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold mb-2">
                        {project.name} ({project.year})
                      </h2>
                      <p className="text-muted-foreground">
                        {project.description}
                      </p>
                    </div>

                    <div className="my-6">
                      {project.beforeAfterImages ? (
                        <BeforeAfterSlider
                          beforeImage={project.beforeAfterImages.before}
                          afterImage={project.beforeAfterImages.after}
                        />
                      ) : project.images && project.images.length > 0 ? (
                        <ProjectCarousel images={project.images} />
                      ) : (
                        <div className="text-center py-4 bg-muted rounded-md">
                          Aucune image disponible
                        </div>
                      )}
                    </div>

                    <div className="mt-6 text-center">
                      <Button onClick={() => navigate("/formulaire")} size="lg">
                        Demander un devis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Projects;
