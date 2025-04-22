
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowRight, Upload } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

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

const budgetRanges = [
  { value: "moins-5000", label: "Moins de 5'000 CHF" },
  { value: "5000-10000", label: "5'000 - 10'000 CHF" },
  { value: "10000-20000", label: "10'000 - 20'000 CHF" },
  { value: "20000-50000", label: "20'000 - 50'000 CHF" },
  { value: "plus-50000", label: "Plus de 50'000 CHF" },
  { value: "a-determiner", label: "À déterminer" },
];

const RenovationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get renovation type from URL
  const searchParams = new URLSearchParams(location.search);
  const renovationParam = searchParams.get("renovation");
  
  const [renovationType, setRenovationType] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [files, setFiles] = useState<File[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    postalCode: "",
    address: "",
    buildingType: "",
    surfaceType: "",
    deadline: "",
    budget: "",
    description: "",
    materialsNeeded: "",
    preferredDate: "",
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormData((prev) => ({ ...prev, preferredDate: date.toISOString() }));
    } else {
      setFormData((prev) => ({ ...prev, preferredDate: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Limit to 5 files total
      if (files.length + newFiles.length > 5) {
        toast({
          title: "Limite atteinte",
          description: "Vous ne pouvez pas télécharger plus de 5 fichiers.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (5MB each)
      const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast({
          title: "Fichier(s) trop volumineux",
          description: "Chaque fichier doit être inférieur à 5 Mo.",
          variant: "destructive",
        });
        return;
      }
      
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast({
        title: "Acceptation requise",
        description: "Veuillez accepter les conditions générales pour continuer.",
        variant: "destructive",
      });
      return;
    }
    
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
    
    toast({
      title: "Demande envoyée",
      description: "Votre demande a été enregistrée avec succès.",
    });
    
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
                Je veux rénover : {renovationType}
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
                      <Label htmlFor="address">Adresse complète</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Rue, numéro, complément"
                        value={formData.address}
                        onChange={handleChange}
                        required
                      />
                    </div>
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
                  
                  <div className="grid gap-4 md:grid-cols-2">
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
                      <Label htmlFor="preferredDate">Date souhaitée (optionnel)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="preferredDate"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? (
                              format(selectedDate, "dd MMMM yyyy", { locale: fr })
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 pointer-events-auto">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description détaillée des travaux à réaliser</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Décrivez votre projet en détail : dimensions, finitions, contraintes spécifiques..."
                      rows={5}
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget indicatif (optionnel)</Label>
                      <Select
                        value={formData.budget}
                        onValueChange={(value) => handleSelectChange("budget", value)}
                      >
                        <SelectTrigger id="budget">
                          <SelectValue placeholder="Sélectionnez un budget" />
                        </SelectTrigger>
                        <SelectContent>
                          {budgetRanges.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fileUpload">Photos ou documents (max 5 fichiers, 5 Mo chacun)</Label>
                    <div className="border border-input rounded-md p-4">
                      <input
                        type="file"
                        id="fileUpload"
                        className="hidden"
                        onChange={handleFileChange}
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <label 
                        htmlFor="fileUpload"
                        className="flex flex-col items-center justify-center cursor-pointer h-32 border-2 border-dashed border-input rounded-md hover:border-primary/50 transition-colors"
                      >
                        <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Cliquez pour ajouter des fichiers
                        </span>
                      </label>
                      
                      {files.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                              <span className="text-sm truncate max-w-[80%]">{file.name}</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                Supprimer
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

                <div className="flex items-start space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                  />
                  <label htmlFor="terms" className="text-sm">
                    J'accepte que Reno360 traite mes données personnelles conformément à sa{" "}
                    <a href="/privacy" className="text-primary underline">
                      politique de confidentialité
                    </a>
                    . Je comprends que mes informations seront utilisées pour traiter ma demande de devis.
                  </label>
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
