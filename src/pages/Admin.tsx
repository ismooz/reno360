import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RenovationRequest } from "@/types";
import { Search, FileSpreadsheet, ChevronDown, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportRequestsToCSV, exportRequestsToExcel } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";
import UserManagement from "@/components/admin/UserManagement";
import AdminSettings from "@/components/admin/AdminSettings";
import EmailSettings from "@/components/admin/EmailSettings";
import SecuritySettings from "@/components/admin/SecuritySettings";
import ServiceManagement from "@/components/admin/ServiceManagement";
import ProjectManagement from "@/components/admin/ProjectManagement";
import RequestsTable from "@/components/admin/RequestsTable";
import { useRenovationRequests } from "@/hooks/useRenovationRequests";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const { toast } = useToast();
  const { requests, updateRequestStatus } = useRenovationRequests();
  const [filteredRequests, setFilteredRequests] = useState<RenovationRequest[]>([]);
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
      const searchLower = filter.search.toLowerCase().trim();
      result = result.filter(req => {
        // Recherche par ID (les 6 derniers caractères)
        const idMatch = req.id.slice(-6).toLowerCase().includes(searchLower) ||
                        req.id.toLowerCase().includes(searchLower);
        
        // Recherche par nom
        const nameMatch = req.name.toLowerCase().includes(searchLower);
        
        // Recherche par email
        const emailMatch = req.email.toLowerCase().includes(searchLower);
        
        // Recherche par type de rénovation
        const typeMatch = (req.renovationType || req.renovation_type)?.toLowerCase().includes(searchLower);
        
        // Recherche par code postal
        const postalMatch = (req.postalCode || req.postal_code || "").toLowerCase().includes(searchLower);
        
        // Recherche par téléphone
        const phoneMatch = (req.phone || "").toLowerCase().includes(searchLower);
        
        // Recherche par adresse
        const addressMatch = (req.address || "").toLowerCase().includes(searchLower);
        
        // Recherche par date (format dd/mm/yyyy ou yyyy-mm-dd)
        const dateStr = req.createdAt || req.created_at;
        const date = new Date(dateStr);
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        const isoDate = dateStr.split('T')[0]; // yyyy-mm-dd
        const dateMatch = formattedDate.includes(searchLower) || isoDate.includes(searchLower);
        
        // Recherche par statut
        const statusLabels: Record<string, string> = {
          pending: "en attente",
          approved: "approuvé",
          "in-progress": "en cours",
          completed: "terminé",
          rejected: "rejeté"
        };
        const statusMatch = statusLabels[req.status]?.includes(searchLower);
        
        return idMatch || nameMatch || emailMatch || typeMatch || postalMatch || 
               phoneMatch || addressMatch || dateMatch || statusMatch;
      });
    }

    setFilteredRequests(result);
    setCurrentPage(1);
  }, [requests, filter]);
  
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
                        
                        <RequestsTable
                          requests={filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                          onStatusChange={updateRequestStatus}
                        />
                        
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
    </Layout>
  );
};

export default Admin;