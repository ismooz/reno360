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
import { Search, Eye, Phone, Download, FileSpreadsheet, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const [activeTab, setActiveTab] = useState("requests");
  const [filter, setFilter] = useState({
    status: "all",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
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
    setCurrentPage(1);
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
      <div className="container py-6 px-3 max-w-full">
        <div className="max-w-7xl mx-auto min-w-0">
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl font-bold">Administration</CardTitle>
              <CardDescription>
                Gérez les demandes de devis, les clients et les paramètres du système
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Desktop tabs */}
                <TabsList className="mb-6 hidden sm:grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto p-1 gap-1">
                  <TabsTrigger value="requests" className="text-xs sm:text-sm px-2 py-2 h-auto">
                    <span className="hidden sm:inline">Demandes</span>
                    <span className="sm:hidden">Dem.</span>
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="text-xs sm:text-sm px-2 py-2 h-auto">
                    <span className="hidden sm:inline">Projets</span>
                    <span className="sm:hidden">Proj.</span>
                  </TabsTrigger>
                  <TabsTrigger value="services" className="text-xs sm:text-sm px-2 py-2 h-auto">
                    <span className="hidden sm:inline">Services</span>
                    <span className="sm:hidden">Serv.</span>
                  </TabsTrigger>
                  <TabsTrigger value="clients" className="text-xs sm:text-sm px-2 py-2 h-auto">
                    <span className="hidden sm:inline">Clients</span>
                    <span className="sm:hidden">Cli.</span>
                  </TabsTrigger>
                  <TabsTrigger value="emails" className="text-xs sm:text-sm px-2 py-2 h-auto">
                    <span className="hidden sm:inline">Emails</span>
                    <span className="sm:hidden">Mail</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="text-xs sm:text-sm px-2 py-2 h-auto">
                    <span className="hidden sm:inline">Sécurité</span>
                    <span className="sm:hidden">Séc.</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 py-2 h-auto">
                    <span className="hidden sm:inline">Paramètres</span>
                    <span className="sm:hidden">Param.</span>
                  </TabsTrigger>
                </TabsList>

                {/* Mobile dropdown */}
                <div className="mb-6 sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {(() => {
                          const tabLabels = {
                            requests: "Demandes",
                            projects: "Projets", 
                            services: "Services",
                            clients: "Clients",
                            emails: "Emails",
                            security: "Sécurité",
                            settings: "Paramètres"
                          };
                          return tabLabels[activeTab as keyof typeof tabLabels];
                        })()}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem onClick={() => setActiveTab("requests")}>
                        Demandes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveTab("projects")}>
                        Projets
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveTab("services")}>
                        Services
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveTab("clients")}>
                        Clients
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveTab("emails")}>
                        Emails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveTab("security")}>
                        Sécurité
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveTab("settings")}>
                        Paramètres
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <TabsContent value="requests" className="mt-6">
                  <div className="space-y-6 max-w-full min-w-0">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-3">
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
                              <SelectTrigger className="w-full sm:w-40">
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
                    </div>
                    
                    {filteredRequests.length === 0 ? (
                      <div className="text-center py-10">
                        <h3 className="text-lg font-medium mb-2">Aucune demande trouvée</h3>
                        <p className="text-muted-foreground">
                          Aucune demande ne correspond à vos critères de recherche.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm text-muted-foreground mb-4">
                          Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, filteredRequests.length)} à {Math.min(currentPage * itemsPerPage, filteredRequests.length)} sur {filteredRequests.length} demande(s)
                        </div>
                        <div className="space-y-4">
                          {filteredRequests
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((request) => (
                          <Card key={request.id}>
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col gap-4 mb-4">
                                <div className="min-w-0">
                                  <h4 className="text-base sm:text-lg font-semibold break-words">{request.renovationType || request.renovation_type}</h4>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
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
                                  <h5 className="text-xs sm:text-sm font-semibold text-primary border-b border-border pb-1">Client</h5>
                                  <div className="space-y-1">
                                    <p className="text-xs sm:text-sm break-words"><span className="text-muted-foreground">Nom:</span> <span className="font-medium">{request.name}</span></p>
                                    <p className="text-xs sm:text-sm break-all"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{request.email}</span></p>
                                    <p className="text-xs sm:text-sm"><span className="text-muted-foreground">Téléphone:</span> <span className="font-medium">{request.phone}</span></p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <h5 className="text-xs sm:text-sm font-semibold text-primary border-b border-border pb-1">Détails du projet</h5>
                                  <div className="space-y-1">
                                    <p className="text-xs sm:text-sm"><span className="text-muted-foreground">Type:</span> <span className="font-medium">{request.buildingType || request.building_type}</span></p>
                                    <p className="text-xs sm:text-sm"><span className="text-muted-foreground">Surface:</span> <span className="font-medium">{request.surfaceType || request.surface_type}</span></p>
                                    <p className="text-xs sm:text-sm"><span className="text-muted-foreground">Code postal:</span> <span className="font-medium">{request.postalCode || request.postal_code}</span></p>
                                    <p className="text-xs sm:text-sm"><span className="text-muted-foreground">Délai:</span> <span className="font-medium">{request.deadline}</span></p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <h5 className="text-xs sm:text-sm font-semibold text-primary border-b border-border pb-1">Description</h5>
                                  <p className="text-xs sm:text-sm text-foreground line-clamp-4 break-words">{request.description}</p>
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
                        {filteredRequests.length > itemsPerPage && (
                          <div className="flex items-center justify-center gap-2 mt-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Précédent
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Page {currentPage} sur {Math.ceil(filteredRequests.length / itemsPerPage)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredRequests.length / itemsPerPage), prev + 1))}
                              disabled={currentPage === Math.ceil(filteredRequests.length / itemsPerPage)}
                            >
                              Suivant
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </>
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