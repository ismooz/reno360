import React, { useState } from "react";
import { RenovationRequest } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Eye, Mail, Phone, Download } from "lucide-react";
import { exportRequestToPDF } from "@/utils/exportUtils";
import RequestDetailDialog from "./RequestDetailDialog";

interface RequestsTableProps {
  requests: RenovationRequest[];
  onStatusChange: (requestId: string, status: string) => void;
}

const statusLabels: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  pending: { label: "En attente", variant: "outline" },
  approved: { label: "Approuvé", variant: "default" },
  "in-progress": { label: "En cours", variant: "secondary" },
  completed: { label: "Terminé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

const RequestsTable: React.FC<RequestsTableProps> = ({ requests, onStatusChange }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedRequest, setSelectedRequest] = useState<RenovationRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
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
    const subject = encodeURIComponent(`Concernant votre demande de ${request.renovationType || request.renovation_type}`);
    const body = encodeURIComponent(`Bonjour ${request.name},\n\nNous avons bien reçu votre demande de ${request.renovationType || request.renovation_type} (Demande #${request.id.slice(-6)}).\n\nCordialement,\nÉquipe Reno360`);
    window.open(`mailto:${request.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const openDetailDialog = (request: RenovationRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10"></TableHead>
              <TableHead className="min-w-[100px]">ID</TableHead>
              <TableHead className="min-w-[150px]">Type</TableHead>
              <TableHead className="min-w-[150px]">Client</TableHead>
              <TableHead className="min-w-[100px]">Date</TableHead>
              <TableHead className="min-w-[120px]">Statut</TableHead>
              <TableHead className="min-w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => {
              const isExpanded = expandedRows.has(request.id);
              return (
                <React.Fragment key={request.id}>
                  <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(request.id)}>
                    <TableCell className="p-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      #{request.id.slice(-6)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {request.renovationType || request.renovation_type}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{request.name}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {request.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(request.createdAt || request.created_at)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={request.status}
                        onValueChange={(value) => onStatusChange(request.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <Badge variant={statusLabels[request.status]?.variant || "outline"} className="text-xs">
                            {statusLabels[request.status]?.label || request.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="in-progress">En cours</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailDialog(request)}
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleContactClient(request)}
                          title="Contacter par email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        {request.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`tel:${request.phone}`, '_blank')}
                            title="Appeler"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportRequestToPDF(request)}
                          title="Exporter PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Ligne extensible avec les détails */}
                  {isExpanded && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Client */}
                            <div className="bg-background rounded-lg p-3 border">
                              <h4 className="font-semibold text-sm mb-2 text-primary">Client</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-muted-foreground">Nom:</span> {request.name}</p>
                                <p><span className="text-muted-foreground">Email:</span> {request.email}</p>
                                {request.phone && (
                                  <p><span className="text-muted-foreground">Tél:</span> {request.phone}</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Projet */}
                            <div className="bg-background rounded-lg p-3 border">
                              <h4 className="font-semibold text-sm mb-2 text-primary">Projet</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-muted-foreground">Type:</span> {request.buildingType || request.building_type || "N/A"}</p>
                                <p><span className="text-muted-foreground">Surface:</span> {request.surfaceType || request.surface_type || "N/A"}</p>
                                {request.budget && (
                                  <p><span className="text-muted-foreground">Budget:</span> {request.budget}</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Localisation */}
                            <div className="bg-background rounded-lg p-3 border">
                              <h4 className="font-semibold text-sm mb-2 text-primary">Localisation</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-muted-foreground">Code postal:</span> {request.postalCode || request.postal_code || "N/A"}</p>
                                {request.address && (
                                  <p><span className="text-muted-foreground">Adresse:</span> {request.address}</p>
                                )}
                                {request.deadline && (
                                  <p><span className="text-muted-foreground">Délai:</span> {request.deadline}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Description */}
                          {request.description && (
                            <div className="bg-background rounded-lg p-3 border">
                              <h4 className="font-semibold text-sm mb-2 text-primary">Description</h4>
                              <p className="text-sm text-muted-foreground line-clamp-3">{request.description}</p>
                            </div>
                          )}
                          
                          {/* Pièces jointes info */}
                          {request.attachments && request.attachments.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              📎 {request.attachments.length} pièce(s) jointe(s)
                            </div>
                          )}
                          
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailDialog(request)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir tous les détails
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog pour les détails complets */}
      <RequestDetailDialog
        request={selectedRequest}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onStatusChange={onStatusChange}
        isAdmin={true}
      />
    </>
  );
};

export default RequestsTable;
