
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
import ProfileEditDialog from "@/components/profile/ProfileEditDialog";
import DeleteAccountDialog from "@/components/profile/DeleteAccountDialog";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const { requests, updateRequestStatus } = useRenovationRequests();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RenovationRequest | null>(null);
  const [isRequestDetailOpen, setIsRequestDetailOpen] = useState(false);
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
      // Rediriger les admins vers le panel d'administration
      if (isAdmin()) {
        navigate("/admin");
        return;
      }
      
      // Pour les clients : calculer leurs statistiques
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      setAllUsers(users);
      
      setStats({
        totalRequests: requests.length,
        pendingRequests: requests.filter((req: RenovationRequest) => req.status === 'pending').length,
        totalUsers: users.length,
        completedRequests: requests.filter((req: RenovationRequest) => req.status === 'completed').length
      });
    }
  }, [user, loading, navigate, requests, isAdmin]);
  
  const handleViewRequest = (request: RenovationRequest) => {
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
  
  if (loading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p>Chargement...</p>
        </div>
      </Layout>
    );
  }
  
  // Plus besoin du dashboard admin ici car on redirige vers /admin
  
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
                                   <h4 className="text-lg font-semibold">{request.renovationType || request.renovation_type}</h4>
                                   <p className="text-sm text-muted-foreground">
                                     Demande #{request.id.slice(-6)} • {formatDate(request.createdAt || request.created_at)}
                                   </p>
                                 </div>
                                 <Badge variant={statusLabels[request.status].variant}>
                                   {statusLabels[request.status].label}
                                 </Badge>
                               </div>
                              
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                 <div>
                                   <p className="text-sm font-medium">Type de bâtiment:</p>
                                   <p className="text-sm">{request.buildingType || request.building_type}</p>
                                 </div>
                                 <div>
                                   <p className="text-sm font-medium">Code postal:</p>
                                   <p className="text-sm">{request.postalCode || request.postal_code}</p>
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
                              
                              {request.attachments && request.attachments.length > 0 && (
                                <div className="mt-2">
                                  <ImageGallery attachments={request.attachments} />
                                </div>
                              )}
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2"
                                onClick={() => handleViewRequest(request)}
                              >
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
                      <Button 
                        variant="outline" 
                        className="mr-2"
                        onClick={() => setIsProfileEditOpen(true)}
                      >
                        Modifier mon profil
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => setIsDeleteAccountOpen(true)}
                      >
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

      {/* Dialogs */}
      <RequestDetailDialog
        request={selectedRequest}
        isOpen={isRequestDetailOpen}
        onClose={() => setIsRequestDetailOpen(false)}
        onStatusChange={updateRequestStatus}
        isAdmin={false}
      />
      <ProfileEditDialog
        isOpen={isProfileEditOpen} 
        onClose={() => setIsProfileEditOpen(false)} 
      />
      <DeleteAccountDialog 
        isOpen={isDeleteAccountOpen} 
        onClose={() => setIsDeleteAccountOpen(false)} 
      />
    </Layout>
  );
};

export default Dashboard;
