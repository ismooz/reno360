import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProjectCarousel from "@/components/projects/ProjectCarousel";
import BeforeAfterSlider from "@/components/projects/BeforeAfterSlider";
import { Project } from "@/types";
import { ArrowLeft } from "lucide-react";
import { sampleProjects } from "@/data/sampleProjects";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!id) return;
    
    // Charger les projets depuis localStorage et combiner avec les exemples
    const storedProjects = localStorage.getItem("projects");
    const userProjects = storedProjects ? JSON.parse(storedProjects) : [];
    
    // Combiner les projets d'exemple avec ceux créés par l'admin
    const allProjects = [...sampleProjects, ...userProjects];
    const foundProject = allProjects.find(p => p.id === id);
    setProject(foundProject || null);
  }, [id]);

  if (!project) {
    return (
      <Layout>
        <div className="container py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Projet non trouvé</h1>
            <Button onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux réalisations
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
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate("/projects")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux réalisations
            </Button>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                <Badge variant="secondary">{project.year}</Badge>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden mb-8">
            <CardContent className="p-0">
              {project.beforeAfterImages ? (
                <BeforeAfterSlider
                  beforeImage={project.beforeAfterImages.before}
                  afterImage={project.beforeAfterImages.after}
                />
              ) : project.images && project.images.length > 0 ? (
                <ProjectCarousel images={project.images} />
              ) : (
                <div className="text-center py-12 bg-muted">
                  <p className="text-muted-foreground">Aucune image disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Description du projet</h2>
              <p className="text-muted-foreground leading-relaxed">
                {project.description}
              </p>
            </CardContent>
          </Card>

          {project.images && project.images.length > 1 && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Galerie photos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.images.map((image, index) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-lg">
                      <img 
                        src={image} 
                        alt={`${project.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => {
                          // Ouvrir l'image en plein écran (optionnel)
                          window.open(image, '_blank');
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <Button 
              onClick={() => navigate("/formulaire")} 
              size="lg"
              className="px-8"
            >
              Demander un devis
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetail;