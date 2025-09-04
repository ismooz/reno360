import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RenovationRequest } from "@/types";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export const useRenovationRequests = () => {
  const [requests, setRequests] = useState<RenovationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('renovation_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Si ce n'est pas un admin, filtrer par utilisateur
      if (!isAdmin()) {
        query = query.eq('user_id', user?.id);
      }

      console.log('Fetching requests for user:', user?.id, 'isAdmin:', isAdmin());

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        // Fallback vers localStorage si Supabase échoue
        const localRequests = JSON.parse(localStorage.getItem("renovationRequests") || "[]");
        const filteredRequests = isAdmin() 
          ? localRequests 
          : localRequests.filter((req: RenovationRequest) => req.clientId === user?.id || req.user_id === user?.id);
        
        console.log('Using localStorage data:', filteredRequests);
        setRequests(filteredRequests);
      } else {
        // Normaliser les données pour la compatibilité
        const normalizedData = (data || []).map(req => ({
          ...req,
          renovationType: req.renovation_type,
          clientId: req.user_id,
          postalCode: req.postal_code,
          buildingType: req.building_type,
          surfaceType: req.surface_type,
          materialsNeeded: req.materials_needed,
          createdAt: req.created_at,
          status: req.status as 'pending' | 'approved' | 'in-progress' | 'completed' | 'rejected'
        }));
        
        console.log('Supabase data:', normalizedData);
        setRequests(normalizedData);
        
        // Si admin et pas de données Supabase, on essaie le localStorage aussi
        if (isAdmin() && normalizedData.length === 0) {
          const localRequests = JSON.parse(localStorage.getItem("renovationRequests") || "[]");
          console.log('Admin: also loading from localStorage:', localRequests);
          setRequests(localRequests);
        }
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      // Fallback vers localStorage
      const localRequests = JSON.parse(localStorage.getItem("renovationRequests") || "[]");
        const filteredRequests = isAdmin() 
          ? localRequests 
          : localRequests.filter((req: RenovationRequest) => req.clientId === user?.id || req.user_id === user?.id);
        
        console.log('Network error, using localStorage:', filteredRequests);
        setRequests(filteredRequests);
    } finally {
      setIsLoading(false);
    }
  };

  const createRequest = async (requestData: Omit<RenovationRequest, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Convertir les données pour la DB
      const dbData = {
        renovation_type: requestData.renovationType || requestData.renovation_type,
        name: requestData.name,
        email: requestData.email,
        phone: requestData.phone,
        postal_code: requestData.postalCode || requestData.postal_code,
        address: requestData.address,
        building_type: requestData.buildingType || requestData.building_type,
        surface_type: requestData.surfaceType || requestData.surface_type,
        deadline: requestData.deadline,
        budget: requestData.budget,
        description: requestData.description,
        materials_needed: requestData.materialsNeeded || requestData.materials_needed,
        preferred_date: requestData.preferred_date,
        attachments: requestData.attachments,
        status: requestData.status,
        user_id: user?.id || null
      };

      const { data, error } = await supabase
        .from('renovation_requests')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de la demande:', error);
        // Fallback vers localStorage
        const newRequest = {
          id: Date.now().toString(),
          ...requestData,
          clientId: requestData.clientId || user?.id || "anonymous",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        const localRequests = JSON.parse(localStorage.getItem("renovationRequests") || "[]");
        localRequests.push(newRequest);
        localStorage.setItem("renovationRequests", JSON.stringify(localRequests));
        setRequests(prev => [newRequest, ...prev]);
        return newRequest;
      } else {
        // Normaliser les données pour la compatibilité
        const normalizedData = {
          ...data,
          renovationType: data.renovation_type,
          clientId: data.user_id,
          postalCode: data.postal_code,
          buildingType: data.building_type,
          surfaceType: data.surface_type,
          materialsNeeded: data.materials_needed,
          createdAt: data.created_at,
          status: data.status as 'pending' | 'approved' | 'in-progress' | 'completed' | 'rejected'
        };
        setRequests(prev => [normalizedData, ...prev]);
        return normalizedData;
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      throw error;
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('renovation_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        // Fallback vers localStorage
        const localRequests = JSON.parse(localStorage.getItem("renovationRequests") || "[]");
        const updatedRequests = localRequests.map((req: RenovationRequest) => 
          req.id === requestId ? { ...req, status } : req
        );
        localStorage.setItem("renovationRequests", JSON.stringify(updatedRequests));
      }

      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: status as 'pending' | 'approved' | 'in-progress' | 'completed' | 'rejected' } : req
      ));

      toast({
        title: "Statut mis à jour",
        description: "Le statut de la demande a été modifié avec succès.",
      });
    } catch (error) {
      console.error('Erreur réseau:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id || 'anonymous'}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('request-attachments')
          .upload(fileName, file);

        if (error) {
          console.error('Erreur upload:', error);
          // Fallback: créer une URL locale
          uploadedUrls.push(URL.createObjectURL(file));
        } else {
          // Obtenir l'URL publique signée pour accéder au fichier
          const { data: { publicUrl } } = supabase.storage
            .from('request-attachments')
            .getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
        }
      } catch (error) {
        console.error('Erreur upload fichier:', error);
        // Fallback: créer une URL locale
        uploadedUrls.push(URL.createObjectURL(file));
      }
    }

    return uploadedUrls;
  };

  const getFileUrl = (attachment: string): string => {
    // Si l'URL commence par blob: ou http, on la retourne telle quelle
    if (attachment.startsWith('blob:') || attachment.startsWith('http')) {
      return attachment;
    }
    
    // Si c'est un chemin de fichier local/upload, essayer de générer l'URL Supabase
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('request-attachments')
        .getPublicUrl(attachment);
      
      console.log('Generated public URL for', attachment, ':', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error generating public URL for', attachment, error);
      return attachment;
    }
  };

  useEffect(() => {
    if (user !== undefined) {
      fetchRequests();
    }
  }, [user]);

  return {
    requests,
    isLoading,
    fetchRequests,
    createRequest,
    updateRequestStatus,
    uploadFiles,
    getFileUrl
  };
};