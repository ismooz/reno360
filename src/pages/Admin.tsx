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
import { Search } from "lucide-react";
import UserManagement from "@/components/admin/UserManagement";
import AdminSettings from "@/components/admin/AdminSettings";
import EmailSettings from "@/components/admin/EmailSettings";
import ServiceManagement from "@/components/admin/ServiceManagement";

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
  const [requests, setRequests] = useState<RenovationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RenovationRequest[]>([]);
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
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                  <TabsTrigger value="emails">Emails</TabsTrigger>
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
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-sm font-medium">Client:</p>
                                  <p className="text-sm">{request.name}</p>
                                  <p className="text-sm">{request.email}</p>
                                  <p className="text-sm">{request.phone}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Détails du projet:</p>
                                  <p className="text-sm">Type: {request.buildingType}</p>
                                  <p className="text-sm">Surface: {request.surfaceType}</p>
                                  <p className="text-sm">Code postal: {request.postalCode}</p>
                                  <p className="text-sm">Délai: {request.deadline}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Description:</p>
                                  <p className="text-sm line-clamp-4">{request.description}</p>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  Voir les détails
                                </Button>
                                <Button size="sm">
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
                
                <TabsContent value="services">
                  <ServiceManagement />
                </TabsContent>
                
                <TabsContent value="clients">
                  <UserManagement />
                </TabsContent>
                
                <TabsContent value="emails">
                  <EmailSettings />
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
