
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RenovationType } from "@/types";
import { Pencil, Trash2, Plus, Tag } from "lucide-react";

const ServiceManagement = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<RenovationType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<RenovationType | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    icon: ""
  });

  const iconOptions = [
    { value: "🏠", label: "🏠 Maison" },
    { value: "🔧", label: "🔧 Outil" },
    { value: "🎨", label: "🎨 Peinture" },
    { value: "🚿", label: "🚿 Douche" },
    { value: "💡", label: "💡 Électricité" },
    { value: "🚪", label: "🚪 Porte" },
    { value: "🌿", label: "🌿 Jardin" },
    { value: "⚡", label: "⚡ Énergie" },
    { value: "🛠️", label: "🛠️ Réparation" },
    { value: "🏗️", label: "🏗️ Construction" },
    { value: "🧱", label: "🧱 Maçonnerie" },
    { value: "🪟", label: "🪟 Fenêtre" },
    { value: "🛁", label: "🛁 Salle de bain" },
    { value: "🍽️", label: "🍽️ Cuisine" },
    { value: "🌡️", label: "🌡️ Chauffage" },
    { value: "❄️", label: "❄️ Climatisation" },
    { value: "🛡️", label: "🛡️ Isolation" },
    { value: "🔲", label: "🔲 Carrelage" },
    { value: "🪵", label: "🪵 Parquet" },
    { value: "💨", label: "💨 Ventilation" },
    { value: "📱", label: "📱 Domotique" },
    { value: "🌳", label: "🌳 Jardin" },
    { value: "🏊", label: "🏊 Piscine" },
    { value: "🪜", label: "🪜 Escalier" },
    { value: "🗄️", label: "🗄️ Rangement" },
    { value: "📚", label: "📚 Bibliothèque" },
    { value: "🏢", label: "🏢 Mezzanine" },
    { value: "☀️", label: "☀️ Terrasse" },
    { value: "🚧", label: "🚧 Clôture" },
    { value: "🚗", label: "🚗 Garage" },
    { value: "⬆️", label: "⬆️ Surélévation" },
    { value: "🧽", label: "🧽 Nettoyage" },
    { value: "🧹", label: "🧹 Entretien" },
    { value: "🚚", label: "🚚 Déménagement" },
    { value: "💻", label: "💻 Bureau" },
    { value: "🛏️", label: "🛏️ Chambre" },
    { value: "🛋️", label: "🛋️ Salon" },
    { value: "➡️", label: "➡️ Couloir" },
    { value: "👕", label: "👕 Buanderie" },
    { value: "📦", label: "📦 Cellier" },
    { value: "🧘", label: "🧘 Spa" },
    { value: "🎬", label: "🎬 Cinéma" },
    { value: "🍷", label: "🍷 Cave à vin" },
    { value: "🏋️", label: "🏋️ Sport" },
    { value: "🏘️", label: "🏘️ Duplex" },
    { value: "📐", label: "📐 Aménagement" },
    { value: "📝", label: "📝 Conseil" }
  ];

  useEffect(() => {
    // Charger les services depuis localStorage ou utiliser les services par défaut
    const storedServices = localStorage.getItem("renovationServices");
    if (storedServices) {
      const parsedServices = JSON.parse(storedServices);
      setServices(parsedServices);
      // Extraire les catégories des services existants
      const uniqueCategories = [...new Set(parsedServices.map((s: RenovationType) => s.category))].filter(Boolean) as string[];
      setCategories(uniqueCategories);
    } else {
      // Charger les services par défaut depuis renovationTypes
      import("@/data/renovationTypes").then(({ renovationTypes }) => {
        setServices(renovationTypes);
        localStorage.setItem("renovationServices", JSON.stringify(renovationTypes));
        // Extraire les catégories des services par défaut
        const uniqueCategories = [...new Set(renovationTypes.map(s => s.category))];
        setCategories(uniqueCategories);
      });
    }
  }, []);

  const handleSaveService = () => {
    if (!formData.name || !formData.description || !formData.category) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const serviceData: RenovationType = {
      id: editingService?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      category: formData.category,
      icon: formData.icon || "🏠"
    };

    let updatedServices;
    if (editingService) {
      updatedServices = services.map(s => s.id === editingService.id ? serviceData : s);
    } else {
      updatedServices = [...services, serviceData];
    }

    setServices(updatedServices);
    localStorage.setItem("renovationServices", JSON.stringify(updatedServices));

    // Mettre à jour les catégories si nécessaire
    if (!categories.includes(formData.category)) {
      const updatedCategories = [...categories, formData.category];
      setCategories(updatedCategories);
    }

    toast({
      title: "Service sauvegardé",
      description: `Le service "${serviceData.name}" a été ${editingService ? 'modifié' : 'ajouté'} avec succès.`,
    });

    handleCloseServiceDialog();
  };

  const handleSaveCategory = () => {
    if (!newCategory.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la catégorie ne peut pas être vide.",
        variant: "destructive",
      });
      return;
    }

    if (categories.includes(newCategory)) {
      toast({
        title: "Erreur",
        description: "Cette catégorie existe déjà.",
        variant: "destructive",
      });
      return;
    }

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    
    toast({
      title: "Catégorie ajoutée",
      description: `La catégorie "${newCategory}" a été créée.`,
    });

    setNewCategory("");
    setIsCategoryDialogOpen(false);
  };

  const handleEdit = (service: RenovationType) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      icon: service.icon || ""
    });
    setIsServiceDialogOpen(true);
  };

  const handleDelete = (service: RenovationType) => {
    const updatedServices = services.filter(s => s.id !== service.id);
    setServices(updatedServices);
    localStorage.setItem("renovationServices", JSON.stringify(updatedServices));
    
    toast({
      title: "Service supprimé",
      description: `Le service "${service.name}" a été supprimé.`,
    });
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    // Vérifier si des services utilisent cette catégorie
    const servicesUsingCategory = services.filter(s => s.category === categoryToDelete);
    
    if (servicesUsingCategory.length > 0) {
      toast({
        title: "Impossible de supprimer",
        description: `${servicesUsingCategory.length} service(s) utilisent encore cette catégorie.`,
        variant: "destructive",
      });
      return;
    }

    const updatedCategories = categories.filter(c => c !== categoryToDelete);
    setCategories(updatedCategories);
    
    toast({
      title: "Catégorie supprimée",
      description: `La catégorie "${categoryToDelete}" a été supprimée.`,
    });
  };

  const handleCloseServiceDialog = () => {
    setIsServiceDialogOpen(false);
    setEditingService(null);
    setFormData({ name: "", description: "", category: "", icon: "" });
  };

  const getCategoryCount = (category: string) => {
    return services.filter(s => s.category === category).length;
  };

  return (
    <div className="space-y-6">
      {/* Gestion des catégories */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestion des catégories</CardTitle>
              <CardDescription>
                Gérez les catégories de services
              </CardDescription>
            </div>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Tag className="w-4 h-4 mr-2" />
                  Nouvelle catégorie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle catégorie</DialogTitle>
                  <DialogDescription>
                    Créez une nouvelle catégorie pour organiser vos services
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Nom de la catégorie</Label>
                    <Input
                      id="categoryName"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Ex: Rénovation écologique"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSaveCategory}>
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {category} ({getCategoryCount(category)})
                </Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer la catégorie "{category}" ? 
                        Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteCategory(category)}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gestion des services */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestion des services</CardTitle>
              <CardDescription>
                Gérez les services de rénovation proposés sur le site
              </CardDescription>
            </div>
            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? "Modifier le service" : "Nouveau service"}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez les détails du service de rénovation
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom du service *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Rénovation de cuisine"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Décrivez le service en quelques phrases..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
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
                  
                  <div>
                    <Label htmlFor="icon">Pictogramme</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un pictogramme" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseServiceDialog}>
                    Annuler
                  </Button>
                  <Button onClick={handleSaveService}>
                    {editingService ? "Modifier" : "Ajouter"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{service.icon}</span>
                      <span className="font-medium">{service.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {service.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm line-clamp-2">
                      {service.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(service)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer le service</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer le service "{service.name}" ? 
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(service)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceManagement;
