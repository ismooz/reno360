
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { RenovationType } from "@/types";
import { Pencil, Trash2, Plus } from "lucide-react";

const ServiceManagement = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<RenovationType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<RenovationType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    icon: ""
  });

  const categories = [
    "Rénovation intérieure",
    "Rénovation extérieure", 
    "Plomberie et chauffage",
    "Électricité",
    "Menuiserie",
    "Jardinage et extérieur"
  ];

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
    { value: "🏗️", label: "🏗️ Construction" }
  ];

  useEffect(() => {
    // Charger les services depuis localStorage ou utiliser les services par défaut
    const storedServices = localStorage.getItem("renovationServices");
    if (storedServices) {
      setServices(JSON.parse(storedServices));
    } else {
      // Charger les services par défaut depuis renovationTypes
      import("@/data/renovationTypes").then(({ renovationTypes }) => {
        const servicesWithIcons = renovationTypes.map(service => ({
          ...service,
          icon: iconOptions[Math.floor(Math.random() * iconOptions.length)].value
        }));
        setServices(servicesWithIcons);
        localStorage.setItem("renovationServices", JSON.stringify(servicesWithIcons));
      });
    }
  }, []);

  const handleSave = () => {
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

    toast({
      title: "Service sauvegardé",
      description: `Le service "${serviceData.name}" a été ${editingService ? 'modifié' : 'ajouté'} avec succès.`,
    });

    handleCloseDialog();
  };

  const handleEdit = (service: RenovationType) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      icon: service.icon || ""
    });
    setIsDialogOpen(true);
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

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    setFormData({ name: "", description: "", category: "", icon: "" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestion des services</CardTitle>
              <CardDescription>
                Gérez les services de rénovation proposés sur le site
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau service
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                      <SelectContent>
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
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Annuler
                  </Button>
                  <Button onClick={handleSave}>
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
                    <span className="text-sm text-muted-foreground">
                      {service.category}
                    </span>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(service)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
