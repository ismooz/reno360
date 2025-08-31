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
import RenovationFormAddress from "@/components/renovation-form/RenovationFormAddress";
import RenovationFormProject from "@/components/renovation-form/RenovationFormProject";
import RenovationFormFiles from "@/components/renovation-form/RenovationFormFiles";
import RenovationFormContact from "@/components/renovation-form/RenovationFormContact";
import RenovationFormTerms from "@/components/renovation-form/RenovationFormTerms";
import { ServiceHeader } from "@/components/renovation-form/ServiceHeader";
import { RenovationType } from "@/types";
import { EmailService } from "@/utils/emailService";

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
  
  const searchParams = new URLSearchParams(location.search);
  const renovationParam = searchParams.get("renovation");
  
  const [renovationType, setRenovationType] = useState("");
  const [currentService, setCurrentService] = useState<RenovationType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [files, setFiles] = useState<File[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || "",
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
      const typeById = findRenovationTypeById(renovationParam);
      if (typeById) {
        setRenovationType(typeById.name);
        setCurrentService(typeById);
      } else {
        const typeByName = findRenovationTypeByName(renovationParam);
        if (typeByName) {
          setRenovationType(typeByName.name);
          setCurrentService(typeByName);
        } else {
          setRenovationType(renovationParam);
          setCurrentService(null);
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
      
      if (files.length + newFiles.length > 5) {
        toast({
          title: "Limite atteinte",
          description: "Vous ne pouvez pas télécharger plus de 5 fichiers.",
          variant: "destructive",
        });
        return;
      }
      
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
    
    // Envoyer notification par email à l'équipe
    EmailService.sendRequestNotification(newRequest);
    
    toast({
      title: "Demande envoyée",
      description: "Votre demande a été enregistrée avec succès.",
    });
    
    navigate("/confirmation");
  };
  
  return (
    <Layout>
      <ServiceHeader 
        renovationType={currentService}
        serviceName={renovationType}
      />
      <div className="container py-10" id="formulaire">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Formulaire de demande
              </CardTitle>
              <CardDescription>
                Remplissez ce formulaire pour recevoir un devis personnalisé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <RenovationFormAddress
                  address={formData.address}
                  postalCode={formData.postalCode}
                  onChange={handleChange}
                />
                <RenovationFormProject
                  buildingTypes={buildingTypes}
                  surfaceTypes={surfaceTypes}
                  deadlineOptions={deadlineOptions}
                  budgetRanges={budgetRanges}
                  formData={formData}
                  selectedDate={selectedDate}
                  handleSelectChange={handleSelectChange}
                  handleDateSelect={handleDateSelect}
                  handleChange={handleChange}
                />
                <RenovationFormFiles
                  files={files}
                  handleFileChange={handleFileChange}
                  removeFile={removeFile}
                />
                <RenovationFormContact
                  formData={formData}
                  handleChange={handleChange}
                />
                <RenovationFormTerms
                  agreedToTerms={agreedToTerms}
                  setAgreedToTerms={setAgreedToTerms}
                />
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
