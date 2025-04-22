
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { findRenovationTypeByName, findRenovationTypeById } from "@/data/renovationTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

const buildingTypes = [
  { value: "appartement", label: "Appartement" },
  { value: "maison", label: "Maison individuelle" },
  { value: "immeuble", label: "Immeuble" },
  { value: "bureau", label: "Bureau / Local commercial" },
  { value: "autre", label: "Autre" },
];

const surfaceTypes = [
  { value: "interieur", label: "Intérieur" },
  { value: "exterieur", label: "Extérieur" },
  { value: "les-deux", label: "Les deux" },
];

const deadlineOptions = [
  { value: "urgent", label: "Urgent (moins d'une semaine)" },
  { value: "rapide", label: "Rapide (1-2 semaines)" },
  { value: "normal", label: "Normal (2-4 semaines)" },
  { value: "flexible", label: "Flexible (plus d'un mois)" },
];

const RenovationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get renovation type from URL
  const searchParams = new URLSearchParams(location.search);
  const renovationParam = searchParams.get("renovation");
  
  const [renovationType, setRenovationType] = useState("");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    postalCode: "",
    buildingType: "",
    surfaceType: "",
    deadline: "",
    description: "",
    materialsNeeded: "",
    includeDocument: false,
  });
  
  useEffect(() => {
    if (renovationParam) {
      // Check if it's an ID or a search term
      const typeById = findRenovationTypeById(renovationParam);
      if (typeById) {
        setRenovationType(typeById.name);
      } else {
        const typeByName = findRenovationTypeByName(renovationParam);
        if (typeByName) {
          setRenovationType(typeByName.name);
        } else {
          setRenovationType(renovationParam);
        }
      }
    }
  }, [renovationParam]);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Dans une application réelle, nous enverrions cela à un backend
    // Pour l'instant, stockons-le dans localStorage
    const newRequest = {
      id: Date.now().toString(),
      renovationType,
      clientId: user?.id || "anonymous",
      ...formData,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    
    const storedRequests = JSON.parse(localStorage.getItem("renovationRequests") || "[]");
    storedRequests.push(newRequest);
    localStorage.setItem("renovationRequests", JSON.stringify(storedRequests));
    
    // Rediriger vers la page de confirmation
    navigate("/confirmation");
  };
  
  return (
    <Layout>
      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Demande de devis : {renovationType}
              </CardTitle>
              <CardDescription>
                Remplissez ce formulaire pour recevoir un devis personnalisé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dans quelle région souhaitez-vous faire vos travaux?</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        placeholder="Ex: 1200"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Description de votre projet</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="buildingType">Bâtiment dans lequel se feront les travaux</Label>
                      <Select
                        value={formData.buildingType}
                        onValueChange={(value) => handleSelectChange("buildingType", value)}
                        required
                      >
                        <SelectTrigger id="buildingType">
                          <SelectValue placeholder="Sélectionnez un type de bâtiment" />
                        </SelectTrigger>
                        <SelectContent>
                          {buildingTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="surfaceType">Genre de surface</Label>
                      <Select
                        value={formData.surfaceType}
                        onValueChange={(value) => handleSelectChange("surfaceType", value)}
                        required
                      >
                        <SelectTrigger id="surfaceType">
                          <SelectValue placeholder="Sélectionnez un type de surface" />
                        </SelectTrigger>
                        <SelectContent>
                          {surfaceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Quels sont vos délais ?</Label>
                    <Select
                      value={formData.deadline}
                      onValueChange={(value) => handleSelectChange("deadline", value)}
                      required
                    >
                      <SelectTrigger id="deadline">
                        <SelectValue placeholder="Sélectionnez un délai" />
                      </SelectTrigger>
                      <SelectContent>
                        {deadlineOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description des travaux à réaliser</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Décrivez votre projet en détail"
                      rows={5}
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="materialsNeeded">Matériels nécessaires</Label>
                    <Select
                      value={formData.materialsNeeded}
                      onValueChange={(value) => handleSelectChange("materialsNeeded", value)}
                      required
                    >
                      <SelectTrigger id="materialsNeeded">
                        <SelectValue placeholder="Sélectionnez une option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fournir">À fournir entièrement</SelectItem>
                        <SelectItem value="partiel">Fourniture partielle</SelectItem>
                        <SelectItem value="non">Non nécessaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Vos coordonnées</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Jean Dupont"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="jean.dupont@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+41 XX XXX XX XX"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <Button type="submit" className="w-full">
                  Envoyer ma demande
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RenovationForm;
