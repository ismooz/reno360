import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RenovationRequest } from "@/types";
import { Phone, Mail, MapPin, Calendar, DollarSign, FileText, Download } from "lucide-react";
import ImageGallery from "@/components/ui/image-gallery";
import { exportRequestToPDF } from "@/utils/exportUtils";

interface RequestDetailDialogProps {
  request: RenovationRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (requestId: string, status: string) => void;
  isAdmin?: boolean;
}

const statusLabels: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  pending: { label: "En attente", variant: "outline" },
  approved: { label: "Approuvé", variant: "default" },
  "in-progress": { label: "En cours", variant: "secondary" },
  completed: { label: "Terminé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

const RequestDetailDialog: React.FC<RequestDetailDialogProps> = ({
  request,
  isOpen,
  onClose,
  onStatusChange,
  isAdmin = false
}) => {
  if (!request) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleContactClient = () => {
    const subject = encodeURIComponent(`Concernant votre demande de ${request.renovationType}`);
    const body = encodeURIComponent(`Bonjour ${request.name},\n\nNous avons bien reçu votre demande de ${request.renovationType} (Demande #${request.id.slice(-6)}).\n\nCordialement,\nÉquipe Reno360`);
    const mailtoUrl = `mailto:${request.email}?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Demande #{request.id.slice(-6)} - {request.renovationType || request.renovation_type}
              </DialogTitle>
              <DialogDescription>
                Soumise le {formatDate(request.createdAt || request.created_at)}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await exportRequestToPDF(request);
                  } catch (error) {
                    console.error('Error exporting PDF:', error);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Badge variant={statusLabels[request.status].variant}>
                {statusLabels[request.status].label}
              </Badge>
              {isAdmin && (
                <Select
                  value={request.status}
                  onValueChange={(value) => onStatusChange(request.id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="in-progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations client */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Informations client
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom complet</p>
                <p className="font-medium">{request.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{request.email}</p>
              </div>
              {request.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{request.phone}</p>
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={handleContactClient}>
                  <Mail className="h-4 w-4 mr-2" />
                  Contacter par email
                </Button>
                {request.phone && (
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Appeler
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Détails du projet */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Détails du projet
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type de rénovation</p>
                <p className="font-medium">{request.renovationType || request.renovation_type}</p>
              </div>
              {(request.buildingType || request.building_type) && (
                <div>
                  <p className="text-sm text-muted-foreground">Type de bâtiment</p>
                  <p className="font-medium">{request.buildingType || request.building_type}</p>
                </div>
              )}
              {(request.surfaceType || request.surface_type) && (
                <div>
                  <p className="text-sm text-muted-foreground">Type de surface</p>
                  <p className="font-medium">{request.surfaceType || request.surface_type}</p>
                </div>
              )}
              {request.deadline && (
                <div>
                  <p className="text-sm text-muted-foreground">Délai souhaité</p>
                  <p className="font-medium">{request.deadline}</p>
                </div>
              )}
              {request.budget && (
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">{request.budget}</p>
                </div>
              )}
            </div>
          </div>

          {/* Localisation */}
          {(request.address || request.postalCode || request.postal_code) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localisation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {request.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-medium">{request.address}</p>
                  </div>
                )}
                {(request.postalCode || request.postal_code) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Code postal</p>
                    <p className="font-medium">{request.postalCode || request.postal_code}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Date préférée */}
          {request.preferred_date && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date préférée
              </h3>
              <p className="font-medium">{formatDate(request.preferred_date)}</p>
            </div>
          )}

          {/* Description */}
          {request.description && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Description du projet</h3>
              <p className="text-sm leading-relaxed">{request.description}</p>
            </div>
          )}

          {/* Matériaux nécessaires */}
          {(request.materialsNeeded || request.materials_needed) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Matériaux nécessaires</h3>
              <p className="text-sm leading-relaxed">{request.materialsNeeded || request.materials_needed}</p>
            </div>
          )}

          {/* Pièces jointes */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Pièces jointes ({request.attachments.length})</h3>
              <ImageGallery attachments={request.attachments} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetailDialog;