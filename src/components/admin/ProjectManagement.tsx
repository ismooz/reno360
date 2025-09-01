import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Image, Upload, X } from "lucide-react";

const ProjectManagement = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear(),
    description: "",
    images: [] as string[],
    beforeAfterImages: {
      before: "",
      after: ""
    }
  });

  useEffect(() => {
    // Charger les projets depuis localStorage
    const storedProjects = localStorage.getItem("projects");
    if (storedProjects) {
      setProjects(JSON.parse(storedProjects));
    }
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      year: new Date().getFullYear(),
      description: "",
      images: [],
      beforeAfterImages: {
        before: "",
        after: ""
      }
    });
    setEditingProject(null);
  };

  const handleSaveProject = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom et la description sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const projectData: Project = {
      id: editingProject?.id || Date.now().toString(),
      name: formData.name.trim(),
      year: formData.year,
      description: formData.description.trim(),
      images: formData.images.filter(img => img.trim()),
      beforeAfterImages: formData.beforeAfterImages.before && formData.beforeAfterImages.after 
        ? formData.beforeAfterImages 
        : undefined
    };

    let updatedProjects;
    if (editingProject) {
      updatedProjects = projects.map(p => p.id === editingProject.id ? projectData : p);
    } else {
      updatedProjects = [...projects, projectData];
    }

    setProjects(updatedProjects);
    localStorage.setItem("projects", JSON.stringify(updatedProjects));

    toast({
      title: editingProject ? "Projet modifié" : "Projet ajouté",
      description: `Le projet "${projectData.name}" a été ${editingProject ? "modifié" : "ajouté"} avec succès.`,
    });

    handleCloseDialog();
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      year: project.year,
      description: project.description,
      images: project.images || [],
      beforeAfterImages: project.beforeAfterImages || { before: "", after: "" }
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    localStorage.setItem("projects", JSON.stringify(updatedProjects));

    const deletedProject = projects.find(p => p.id === projectId);
    toast({
      title: "Projet supprimé",
      description: `Le projet "${deletedProject?.name}" a été supprimé.`,
    });
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleImageAdd = () => {
    setFormData({
      ...formData,
      images: [...formData.images, ""]
    });
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({
      ...formData,
      images: newImages
    });
  };

  const handleImageRemove = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      images: newImages
    });
  };

  const handleFileUpload = (file: File, type: 'before' | 'after') => {
    if (file) {
      // Créer une URL locale pour l'image
      const imageUrl = URL.createObjectURL(file);
      
      setFormData({
        ...formData,
        beforeAfterImages: {
          ...formData.beforeAfterImages,
          [type]: imageUrl
        }
      });

      toast({
        title: "Image ajoutée",
        description: `L'image "${type}" a été ajoutée avec succès.`,
      });
    }
  };

  const handleBeforeImageUpload = () => {
    beforeFileInputRef.current?.click();
  };

  const handleAfterImageUpload = () => {
    afterFileInputRef.current?.click();
  };

  const removeBeforeAfterImage = (type: 'before' | 'after') => {
    setFormData({
      ...formData,
      beforeAfterImages: {
        ...formData.beforeAfterImages,
        [type]: ""
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestion des réalisations</h3>
          <p className="text-sm text-muted-foreground">
            Ajoutez, modifiez ou supprimez vos projets de rénovation.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? "Modifier le projet" : "Ajouter un nouveau projet"}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations du projet de rénovation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du projet *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Rénovation cuisine moderne"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Année</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    min="2000"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez le projet de rénovation..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Images du projet</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleImageAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une image
                  </Button>
                </div>
                {formData.images.map((image, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder="URL de l'image"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleImageRemove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Label>Images Avant/Après (optionnel)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Image "Avant"</Label>
                    {formData.beforeAfterImages.before ? (
                      <div className="relative">
                        <img 
                          src={formData.beforeAfterImages.before} 
                          alt="Avant" 
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeBeforeAfterImage('before')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-32 border-dashed"
                        onClick={handleBeforeImageUpload}
                      >
                        <Upload className="h-6 w-6 mr-2" />
                        Ajouter une image "Avant"
                      </Button>
                    )}
                    <input
                      ref={beforeFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'before');
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image "Après"</Label>
                    {formData.beforeAfterImages.after ? (
                      <div className="relative">
                        <img 
                          src={formData.beforeAfterImages.after} 
                          alt="Après" 
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeBeforeAfterImage('after')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-32 border-dashed"
                        onClick={handleAfterImageUpload}
                      >
                        <Upload className="h-6 w-6 mr-2" />
                        Ajouter une image "Après"
                      </Button>
                    )}
                    <input
                      ref={afterFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'after');
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button onClick={handleSaveProject}>
                {editingProject ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Aucun projet</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par ajouter votre premier projet de rénovation.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un projet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">{project.name}</h4>
                    <p className="text-sm text-muted-foreground">Année: {project.year}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditProject(project)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le projet</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer le projet "{project.name}" ?
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <p className="text-sm mb-4">{project.description}</p>
                
                <div className="flex gap-2 flex-wrap">
                  {project.images && project.images.length > 0 && (
                    <Badge variant="secondary">
                      {project.images.length} image{project.images.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {project.beforeAfterImages && (
                    <Badge variant="outline">Avant/Après</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;