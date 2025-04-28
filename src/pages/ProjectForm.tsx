
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";

const ProjectForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);

  // Vérification admin
  if (!user || user.id !== "1") {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Dans une vraie application, on uploaderait les images vers un service de stockage
    // Pour l'exemple, on simule avec des URLs locales
    const project = {
      id: Date.now().toString(),
      name,
      year,
      description,
      images: images.map(file => URL.createObjectURL(file)),
      ...(beforeImage && afterImage ? {
        beforeAfterImages: {
          before: URL.createObjectURL(beforeImage),
          after: URL.createObjectURL(afterImage)
        }
      } : {})
    };

    // Sauvegarder dans localStorage
    const existingProjects = JSON.parse(localStorage.getItem("projects") || "[]");
    localStorage.setItem("projects", JSON.stringify([...existingProjects, project]));

    navigate("/projects");
  };

  return (
    <Layout>
      <div className="container py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Nouvelle réalisation</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nom du projet
              </label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Année
              </label>
              <Input
                type="number"
                required
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Images du projet
              </label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setImages(files);
                }}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Avant/Après (optionnel)</h3>
              <div>
                <label className="block text-sm mb-2">Image avant</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBeforeImage(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Image après</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAfterImage(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit">Enregistrer</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/projects")}
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectForm;
