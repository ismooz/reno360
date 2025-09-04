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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RenovationRequest } from "@/types";
import { Search, Eye, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserManagement from "@/components/admin/UserManagement";
import AdminSettings from "@/components/admin/AdminSettings";
import EmailSettings from "@/components/admin/EmailSettings";
import SecuritySettings from "@/components/admin/SecuritySettings";
import ServiceManagement from "@/components/admin/ServiceManagement";
import ProjectManagement from "@/components/admin/ProjectManagement";
import ImageGallery from "@/components/ui/image-gallery";

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
  const [requests, setRequests] = useState<RenovationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RenovationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RenovationRequest | null>(null);
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
    
    // Charger toutes les demandes depuis localStorage
    const allRequests = JSON.parse(localStorage.getItem("renovationRequests") || "[]");
    setRequests(allRequests);
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
        req => req.renovationType.toLowerCase().includes(searchLower) ||
              req.name.toLowerCase().includes(searchLower) ||
              req.email.toLowerCase().includes(searchLower) ||
              req.postalCode.includes(searchLower)
      );
    }
    
    setFilteredRequests(result);
  }, [requests, filter]);
  
  const handleStatusChange = async (requestId: string, newStatus: string) => {
    const updatedRequests = requests.map(req => 
      req.id === requestId ? { ...req, status: newStatus as any } : req
    );
    
    setRequests(updatedRequests);
    localStorage.setItem("renovationRequests", JSON.stringify(updatedRequests));
    
    // Mettre à jour le nombre de demandes pour l'utilisateur
    const request = requests.find(req => req.id === requestId);
    if (request) {
      // Envoyer notification par email pour le changement de statut (simulé)
      const notifications = JSON.parse(localStorage.getItem("userNotifications") || "[]");
      notifications.push({
        id: Date.now().toString(),
        userId: request.clientId,
        type: "request_status_change",
        title: "Mise à jour de votre demande",
        message: `Le statut de votre demande de "${request.renovationType}" a changé en "${statusLabels[newStatus as keyof typeof statusLabels].label}".`,
        read: false,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem("userNotifications", JSON.stringify(notifications));
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const handleViewDetails = (request: RenovationRequest) => {
    setSelectedRequest(request);
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
                <TabsList className="mb-6">
                  <TabsTrigger value="requests">Demandes</TabsTrigger>
                  <TabsTrigger value="projects">Réalisations</TabsTrigger>
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                  <TabsTrigger value="emails">Emails</TabsTrigger>
                  <TabsTrigger value="security">Sécurité</TabsTrigger>
                  <TabsTrigger value="settings">Paramètres</TabsTrigger>
                </TabsList>
                
                <TabsContent value="requests">
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                      <div className="flex-1 flex gap-4">
                        <div className="w-full md:w-64">
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
                      </div>
                      <div>
                        <Button variant="outline">Exporter</Button>
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
                              <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                <div>
                                  <h4 className="text-lg font-semibold">{request.renovationType}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Demande #{request.id.slice(-6)} • {formatDate(request.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={statusLabels[request.status].variant}>
                                    {statusLabels[request.status].label}
                                  </Badge>
                                  <Select
                                    value={request.status}
                                    onValueChange={(value) => handleStatusChange(request.id, value)}
                                  >
                                    <SelectTrigger className="w-36">
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
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
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
                                    <p className="text-sm"><span className="text-muted-foreground">Type:</span> <span className="font-medium">{request.buildingType}</span></p>
                                    <p className="text-sm"><span className="text-muted-foreground">Surface:</span> <span className="font-medium">{request.surfaceType}</span></p>
                                    <p className="text-sm"><span className="text-muted-foreground">Code postal:</span> <span className="font-medium">{request.postalCode}</span></p>
                                    <p className="text-sm"><span className="text-muted-foreground">Délai:</span> <span className="font-medium">{request.deadline}</span></p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <h5 className="text-sm font-semibold text-primary border-b border-border pb-1">Description</h5>
                                  <p className="text-sm text-foreground line-clamp-4">{request.description}</p>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Voir les détails
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Détails de la demande #{request.id.slice(-6)}</DialogTitle>
                                      <DialogDescription>
                                        Demande de {request.renovationType} soumise le {formatDate(request.createdAt)}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-6">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-semibold mb-2">Informations client</h4>
                                          <div className="space-y-1 text-sm">
                                            <p><strong>Nom:</strong> {request.name}</p>
                                            <p><strong>Email:</strong> {request.email}</p>
                                            <p><strong>Téléphone:</strong> {request.phone || "Non spécifié"}</p>
                                          </div>
                                        </div>
                                        <div>
                                          <h4 className="font-semibold mb-2">Projet</h4>
                                          <div className="space-y-1 text-sm">
                                            <p><strong>Type:</strong> {request.renovationType}</p>
                                            <p><strong>Bâtiment:</strong> {request.buildingType || "Non spécifié"}</p>
                                            <p><strong>Surface:</strong> {request.surfaceType || "Non spécifiée"}</p>
                                            <p><strong>Délai:</strong> {request.deadline || "Non spécifié"}</p>
                                            <p><strong>Budget:</strong> {request.budget || "Non spécifié"}</p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-semibold mb-2">Localisation</h4>
                                        <p className="text-sm">Code postal: {request.postalCode || "Non spécifié"}</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-semibold mb-2">Description du projet</h4>
                                        <p className="text-sm">{request.description || "Aucune description fournie"}</p>
                                      </div>
                                      
                                      {request.materialsNeeded && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Matériaux nécessaires</h4>
                                          <p className="text-sm">{request.materialsNeeded}</p>
                                        </div>
                                      )}
                                      
                                      
                                      {request.attachments && request.attachments.length > 0 && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Pièces jointes</h4>
                                          <ImageGallery attachments={request.attachments} />
                                        </div>
                                      )}
                                      
                                      <div>
                                        <h4 className="font-semibold mb-2">Statut actuel</h4>
                                        <Badge variant={statusLabels[request.status].variant}>
                                          {statusLabels[request.status].label}
                                        </Badge>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                
                                <Button size="sm" onClick={() => handleContactClient(request)}>
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
    </Layout>
  );
};

export default Admin;
