import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RenovationRequest } from "@/types";
import { Search, Eye, Phone, Download, FileSpreadsheet } from "lucide-react";
import { exportRequestsToCSV, exportRequestsToExcel } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";
import UserManagement from "@/components/admin/UserManagement";
import AdminSettings from "@/components/admin/AdminSettings";
import EmailSettings from "@/components/admin/EmailSettings";
import SecuritySettings from "@/components/admin/SecuritySettings";
import ServiceManagement from "@/components/admin/ServiceManagement";
import ProjectManagement from "@/components/admin/ProjectManagement";
import ImageGallery from "@/components/ui/image-gallery";
import RequestDetailDialog from "@/components/admin/RequestDetailDialog";
import { useRenovationRequests } from "@/hooks/useRenovationRequests";

const statusLabels: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  pending: { label: "En attente", variant: "outline" },
  approved: { label: "Approuvé", variant: "default" },
  "in-progress": { label: "En cours", variant: "secondary" },
  completed: { label: "Terminé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const { toast } = useToast();
  const { requests, updateRequestStatus } = useRenovationRequests();
  const [filteredRequests, setFilteredRequests] = useState<RenovationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RenovationRequest | null>(null);
  const [isRequestDetailOpen, setIsRequestDetailOpen] = useState(false);
  const [filter, setFilter] = useState({
    status: "all",
    search: "",
  });
  
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    
    if (user && !isAdmin()) {
      navigate("/dashboard");
      return;
    }
  }, [user, loading, navigate, isAdmin]);
  
  useEffect(() => {
    // Appliquer les filtres
    let result = [...requests];
    
    if (filter.status !== "all") {
      result = result.filter(req => req.status === filter.status);
    }
    
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(
        req => (req.renovationType || req.renovation_type)?.toLowerCase().includes(searchLower) ||
              req.name.toLowerCase().includes(searchLower) ||
              req.email.toLowerCase().includes(searchLower) ||
              (req.postalCode || req.postal_code || "").includes(searchLower)
      );
    }
    
    setFilteredRequests(result);
  }, [requests, filter]);
  
  const handleViewDetails = (request: RenovationRequest) => {
    setSelectedRequest(request);
    setIsRequestDetailOpen(true);
  };

  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const handleContactClient = (request: RenovationRequest) => {
    // Créer un lien mailto avec les informations préremplies
    const subject = encodeURIComponent(`Concernant votre demande de ${request.renovationType}`);
    const body = encodeURIComponent(`Bonjour ${request.name},\n\nNous avons bien reçu votre demande de ${request.renovationType} (Demande #${request.id.slice(-6)}).\n\nCordialement,\nÉquipe Reno360`);
    const mailtoUrl = `mailto:${request.email}?subject=${subject}&body=${body}`;
    
    window.open(mailtoUrl, '_blank');
    
    toast({
      title: "Client contacté",
      description: `Email préparé pour ${request.name}`,
    });
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p>Chargement...</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container py-10">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Administration</CardTitle>
              <CardDescription>
                Gérez les demandes de devis, les clients et les paramètres du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="requests">
                <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto">
                  <TabsTrigger value="requests" className="text-xs">Demandes</TabsTrigger>
                  <TabsTrigger value="projects" className="text-xs">Projets</TabsTrigger>
                  <TabsTrigger value="services" className="text-xs">Services</TabsTrigger>
                  <TabsTrigger value="clients" className="text-xs">Clients</TabsTrigger>
                  <TabsTrigger value="emails" className="text-xs">Emails</TabsTrigger>
                  <TabsTrigger value="security" className="text-xs">Sécurité</TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs">Paramètres</TabsTrigger>
                </TabsList>
                
                <TabsContent value="requests">
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-48">
                          <Select
                            value={filter.status}
                            onValueChange={(value) => setFilter({ ...filter, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous les statuts</SelectItem>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="approved">Approuvé</SelectItem>
                              <SelectItem value="in-progress">En cours</SelectItem>
                              <SelectItem value="completed">Terminé</SelectItem>
                              <SelectItem value="rejected">Rejeté</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={filter.search}
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                            placeholder="Rechercher..."
                            className="pl-10"
                          />
                        </div>
                        <div className="w-full sm:w-auto">
                          <Select onValueChange={(value) => {
                            if (value === "csv") exportRequestsToCSV(filteredRequests);
                            if (value === "excel") exportRequestsToExcel(filteredRequests);
                          }}>
                            <SelectTrigger className="w-full sm:w-32">
                              <SelectValue placeholder="Exporter" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="csv">
                                <div className="flex items-center gap-2">
                                  <FileSpreadsheet className="h-4 w-4" />
                                  CSV
                                </div>
                              </SelectItem>
                              <SelectItem value="excel">
                                <div className="flex items-center gap-2">
                                  <Download className="h-4 w-4" />
                                  Excel
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    {filteredRequests.length === 0 ? (
                      <div className="text-center py-10">
                        <h3 className="text-lg font-medium mb-2">Aucune demande trouvée</h3>
                        <p className="text-muted-foreground">
                          Aucune demande ne correspond à vos critères de recherche.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredRequests.map((request) => (
                          <Card key={request.id}>
                            <CardContent className="p-6">
                               <div className="flex flex-col gap-4 mb-4">
                                 <div>
                                   <h4 className="text-lg font-semibold">{request.renovationType || request.renovation_type}</h4>
                                   <p className="text-sm text-muted-foreground">
                                     Demande #{request.id.slice(-6)} • {formatDate(request.createdAt || request.created_at)}
                                   </p>
                                 </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  <Badge variant={statusLabels[request.status].variant}>
                                    {statusLabels[request.status].label}
                                  </Badge>
                                   <Select
                                     value={request.status}
                                     onValueChange={(value) => updateRequestStatus(request.id, value)}
                                   >
                                     <SelectTrigger className="w-full sm:w-40">
                                       <SelectValue placeholder="Changer le statut" />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="pending">En attente</SelectItem>
                                       <SelectItem value="approved">Approuvé</SelectItem>
                                       <SelectItem value="in-progress">En cours</SelectItem>
                                       <SelectItem value="completed">Terminé</SelectItem>
                                       <SelectItem value="rejected">Rejeté</SelectItem>
                                     </SelectContent>
                                   </Select>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                                <div className="space-y-3">
                                  <h5 className="text-sm font-semibold text-primary border-b border-border pb-1">Client</h5>
                                  <div className="space-y-1">
                                    <p className="text-sm"><span className="text-muted-foreground">Nom:</span> <span className="font-medium">{request.name}</span></p>
                                    <p className="text-sm"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{request.email}</span></p>
                                    <p className="text-sm"><span className="text-muted-foreground">Téléphone:</span> <span className="font-medium">{request.phone}</span></p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <h5 className="text-sm font-semibold text-primary border-b border-border pb-1">Détails du projet</h5>
                                     <div className="space-y-1">
                                       <p className="text-sm"><span className="text-muted-foreground">Type:</span> <span className="font-medium">{request.buildingType || request.building_type}</span></p>
                                       <p className="text-sm"><span className="text-muted-foreground">Surface:</span> <span className="font-medium">{request.surfaceType || request.surface_type}</span></p>
                                       <p className="text-sm"><span className="text-muted-foreground">Code postal:</span> <span className="font-medium">{request.postalCode || request.postal_code}</span></p>
                                       <p className="text-sm"><span className="text-muted-foreground">Délai:</span> <span className="font-medium">{request.deadline}</span></p>
                                     </div>
                                   </div>
                                   <div className="space-y-3">
                                     <h5 className="text-sm font-semibold text-primary border-b border-border pb-1">Description</h5>
                                     <p className="text-sm text-foreground line-clamp-4">{request.description}</p>
                                </div>
                               </div>
                               
                               {request.attachments && request.attachments.length > 0 && (
                                 <div className="mb-4">
                                   <ImageGallery attachments={request.attachments} />
                                 </div>
                               )}
                               
                                 <div className="flex flex-col sm:flex-row gap-2">
                                   <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)} className="w-full sm:w-auto">
                                     <Eye className="h-4 w-4 mr-2" />
                                     Voir les détails
                                   </Button>
                                   
                                   <Button size="sm" onClick={() => handleContactClient(request)} className="w-full sm:w-auto">
                                     <Phone className="h-4 w-4 mr-2" />
                                     Contacter le client
                                   </Button>
                                 </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="projects">
                  <ProjectManagement />
                </TabsContent>
                
                <TabsContent value="services">
                  <ServiceManagement />
                </TabsContent>
                
                <TabsContent value="clients">
                  <UserManagement />
                </TabsContent>
                
                <TabsContent value="emails">
                  <EmailSettings />
                </TabsContent>
                
                <TabsContent value="security">
                  <SecuritySettings />
                </TabsContent>
                
                <TabsContent value="settings">
                  <AdminSettings />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <RequestDetailDialog
        request={selectedRequest}
        isOpen={isRequestDetailOpen}
        onClose={() => setIsRequestDetailOpen(false)}
        onStatusChange={updateRequestStatus}
        isAdmin={true}
      />
    </Layout>
  );
};

export default Admin;
