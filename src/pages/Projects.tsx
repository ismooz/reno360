
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProjectCarousel from "@/components/projects/ProjectCarousel";
import BeforeAfterSlider from "@/components/projects/BeforeAfterSlider";
import { Project } from "@/types";
import { useNavigate } from "react-router-dom";
import { sampleProjects } from "@/data/sampleProjects";

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Charger les projets depuis localStorage et combiner avec les exemples
    const storedProjects = localStorage.getItem("projects");
    const userProjects = storedProjects ? JSON.parse(storedProjects) : [];
    
    // Récupérer les IDs des projets supprimés
    const deletedIds = localStorage.getItem("deletedSampleProjectIds");
    const deletedSampleIds: string[] = deletedIds ? JSON.parse(deletedIds) : [];
    
    // Filtrer les projets d'exemple qui n'ont pas été supprimés
    const visibleSampleProjects = sampleProjects.filter(p => !deletedSampleIds.includes(p.id));
    
    // Combiner les projets d'exemple avec ceux créés par l'admin
    // Les projets utilisateur peuvent remplacer les projets d'exemple s'ils ont le même ID
    const sampleIds = visibleSampleProjects.map(p => p.id);
    const nonDuplicateUserProjects = userProjects.filter((p: { id: string }) => !sampleIds.includes(p.id));
    
    const allProjects = [...visibleSampleProjects.map(sp => {
      // Si un projet utilisateur a le même ID (modifié), utiliser la version utilisateur
      const modifiedVersion = userProjects.find((up: { id: string }) => up.id === sp.id);
      return modifiedVersion || sp;
    }), ...nonDuplicateUserProjects];
    
    setProjects(allProjects);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-video overflow-hidden">
                      {project.beforeAfterImages ? (
                        <img 
                          src={project.beforeAfterImages.after} 
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : project.images && project.images.length > 0 ? (
                        <img 
                          src={project.images[0]} 
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground">Aucune image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Année: {project.year}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>
                      <Button 
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="w-full"
                        variant="outline"
                      >
                        Voir plus
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
