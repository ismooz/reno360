
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RenovationRequest, User } from "@/types";
import { FileText, Users, TrendingUp, Calendar, Shield, Settings } from "lucide-react";

const statusLabels: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  pending: { label: "En attente", variant: "outline" },
  approved: { label: "Approuvé", variant: "default" },
  "in-progress": { label: "En cours", variant: "secondary" },
  completed: { label: "Terminé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const [requests, setRequests] = useState<RenovationRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    totalUsers: 0,
    completedRequests: 0
  });
  
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    
    if (user) {
      // Charger les demandes depuis localStorage
      const allRequests = JSON.parse(localStorage.getItem("renovationRequests") || "[]");
      
      if (user.role === "admin") {
        // Pour les admins : charger toutes les demandes et tous les utilisateurs
        setRequests(allRequests);
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        setAllUsers(users);
        
        // Calculer les statistiques
        setStats({
          totalRequests: allRequests.length,
          pendingRequests: allRequests.filter((req: RenovationRequest) => req.status === 'pending').length,
          totalUsers: users.length,
          completedRequests: allRequests.filter((req: RenovationRequest) => req.status === 'completed').length
        });
      } else {
        // Pour les clients : seulement leurs demandes
        const userRequests = allRequests.filter((req: RenovationRequest) => req.clientId === user.id);
        setRequests(userRequests);
      }
    }
  }, [user, loading, navigate]);
  
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
  
  
  if (user?.role === "admin") {
    // Dashboard pour admins
    return (
      <Layout>
        <div className="container py-10">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  Tableau de bord administrateur
                </CardTitle>
                <CardDescription>
                  Vue d'ensemble des demandes, clients et activités
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.totalRequests}</p>
                          <p className="text-sm text-muted-foreground">Total demandes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-8 w-8 text-orange-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                          <p className="text-sm text-muted-foreground">En attente</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.totalUsers}</p>
                          <p className="text-sm text-muted-foreground">Utilisateurs</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.completedRequests}</p>
                          <p className="text-sm text-muted-foreground">Terminées</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions rapides */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  <Button onClick={() => navigate("/admin")} className="h-16 text-left flex items-center gap-3">
                    <Settings className="h-6 w-6" />
                    <div>
                      <p className="font-medium">Administration</p>
                      <p className="text-sm opacity-90">Gérer le système</p>
                    </div>
                  </Button>
                  
                  <Button onClick={() => navigate("/projects/new")} variant="outline" className="h-16 text-left flex items-center gap-3">
                    <FileText className="h-6 w-6" />
                    <div>
                      <p className="font-medium">Nouvelle réalisation</p>
                      <p className="text-sm opacity-70">Ajouter un projet</p>
                    </div>
                  </Button>
                  
                  <Button onClick={() => navigate("/services")} variant="outline" className="h-16 text-left flex items-center gap-3">
                    <Users className="h-6 w-6" />
                    <div>
                      <p className="font-medium">Gérer les services</p>
                      <p className="text-sm opacity-70">CRUD services</p>
                    </div>
                  </Button>
                </div>

                <Tabs defaultValue="recent-requests">
                  <TabsList className="mb-6">
                    <TabsTrigger value="recent-requests">Demandes récentes</TabsTrigger>
                    <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="recent-requests">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Dernières demandes</h3>
                        <Button onClick={() => navigate("/admin")} variant="outline">
                          Voir toutes
                        </Button>
                      </div>
                      
                      {requests.slice(0, 5).map((request) => (
                        <Card key={request.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">{request.renovationType}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {request.name} • #{request.id.slice(-6)}
                                </p>
                              </div>
                              <Badge variant={statusLabels[request.status].variant}>
                                {statusLabels[request.status].label}
                              </Badge>
                            </div>
                            <p className="text-sm">{request.postalCode} • {formatDate(request.createdAt)}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="users">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Utilisateurs récents</h3>
                        <Button onClick={() => navigate("/admin")} variant="outline">
                          Gérer les utilisateurs
                        </Button>
                      </div>
                      
                      {allUsers.slice(0, 5).map((userData) => (
                        <Card key={userData.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-semibold">{userData.name || userData.email}</h4>
                                <p className="text-sm text-muted-foreground">{userData.email}</p>
                              </div>
                              <Badge variant={userData.role === "admin" ? "default" : "secondary"}>
                                {userData.role === "admin" ? "Admin" : "Client"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // Dashboard pour clients
  return (
    <Layout>
      <div className="container py-10">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Mon espace client</CardTitle>
              <CardDescription>
                Gérez vos demandes de rénovation et suivez leur avancement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="requests">
                <TabsList className="mb-6">
                  <TabsTrigger value="requests">Mes demandes</TabsTrigger>
                  <TabsTrigger value="profile">Mon profil</TabsTrigger>
                </TabsList>
                
                <TabsContent value="requests">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Demandes de devis</h3>
                      <Button onClick={() => navigate("/formulaire")}>
                        Nouvelle demande
                      </Button>
                    </div>
                    
                    {requests.length === 0 ? (
                      <div className="text-center py-10">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Aucune demande trouvée</h3>
                        <p className="text-muted-foreground mb-4">
                          Vous n'avez pas encore fait de demande de devis.
                        </p>
                        <Button onClick={() => navigate("/formulaire")}>
                          Faire une demande
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {requests.map((request) => (
                          <Card key={request.id}>
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h4 className="text-lg font-semibold">{request.renovationType}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Demande #{request.id.slice(-6)} • {formatDate(request.createdAt)}
                                  </p>
                                </div>
                                <Badge variant={statusLabels[request.status].variant}>
                                  {statusLabels[request.status].label}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm font-medium">Type de bâtiment:</p>
                                  <p className="text-sm">{request.buildingType}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Code postal:</p>
                                  <p className="text-sm">{request.postalCode}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Délai:</p>
                                  <p className="text-sm">{request.deadline}</p>
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <p className="text-sm font-medium">Description:</p>
                                <p className="text-sm line-clamp-2">{request.description}</p>
                              </div>
                              
                              <Button variant="outline" size="sm">
                                Voir les détails
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="profile">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Nom:</p>
                          <p>{user?.user_metadata?.name || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Email:</p>
                          <p>{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="mr-2">
                        Modifier mon profil
                      </Button>
                      <Button variant="destructive">
                        Supprimer mon compte
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
