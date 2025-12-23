import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { RenovationRequest } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Helper function to convert image URL to base64
const getImageBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

// Helper function to get file URL from Supabase using signed URLs for private bucket
const getFileUrl = async (attachment: string): Promise<string> => {
  if (attachment.startsWith('blob:') || attachment.startsWith('http')) {
    return attachment;
  }
  
  try {
    // Use signed URL for private bucket access
    const { data, error } = await supabase.functions.invoke('get-signed-url', {
      body: { filePath: attachment, bucket: 'request-attachments' }
    });
    
    if (error) {
      console.error('Error getting signed URL for', attachment, error);
      return attachment;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error generating signed URL for', attachment, error);
    return attachment;
  }
};

export const exportRequestToPDF = async (request: RenovationRequest) => {
  const doc = new jsPDF();
  
  // En-tête
  doc.setFontSize(20);
  doc.text('Demande de Rénovation', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Référence: #${request.id.slice(-6)}`, 20, 35);
  doc.text(`Date: ${new Date(request.created_at || request.createdAt || '').toLocaleDateString('fr-CH')}`, 20, 45);
  doc.text(`Statut: ${getStatusLabel(request.status)}`, 20, 55);
  
  // Informations client
  doc.setFontSize(16);
  doc.text('Informations Client', 20, 75);
  
  const clientData = [
    ['Nom', request.name],
    ['Email', request.email],
    ['Téléphone', request.phone || '-'],
    ['Adresse', request.address || '-'],
    ['Code postal', request.postal_code || request.postalCode || '-']
  ];
  
  let currentY = 85;
  autoTable(doc, {
    startY: currentY,
    body: clientData,
    theme: 'grid',
    styles: { fontSize: 10 }
  });
  
  // @ts-ignore - lastAutoTable est disponible après autoTable
  currentY = doc.lastAutoTable.finalY + 20;
  
  // Détails du projet
  doc.setFontSize(16);
  doc.text('Détails du Projet', 20, currentY);
  
  const projectData = [
    ['Type de rénovation', request.renovation_type || request.renovationType || '-'],
    ['Type de bâtiment', request.building_type || request.buildingType || '-'],
    ['Type de surface', request.surface_type || request.surfaceType || '-'],
    ['Délai souhaité', request.deadline || '-'],
    ['Budget', request.budget || '-'],
    ['Matériaux nécessaires', request.materials_needed || request.materialsNeeded || '-'],
    ['Date préférée', request.preferred_date ? new Date(request.preferred_date).toLocaleDateString('fr-CH') : '-']
  ];
  
  autoTable(doc, {
    startY: currentY + 10,
    body: projectData,
    theme: 'grid',
    styles: { fontSize: 10 }
  });
  
  // @ts-ignore - lastAutoTable est disponible après autoTable
  currentY = doc.lastAutoTable.finalY + 20;
  
  // Description
  if (request.description) {
    doc.setFontSize(16);
    doc.text('Description', 20, currentY);
    
    const splitDescription = doc.splitTextToSize(request.description, 170);
    doc.setFontSize(10);
    doc.text(splitDescription, 20, currentY + 15);
    currentY += 40;
  }
  
  // Pièces jointes avec images
  if (request.attachments && request.attachments.length > 0) {
    doc.setFontSize(16);
    doc.text('Pièces Jointes', 20, currentY);
    doc.setFontSize(10);
    doc.text(`${request.attachments.length} fichier(s) joint(s)`, 20, currentY + 15);
    currentY += 25;
    
    // Traiter chaque pièce jointe
    for (let i = 0; i < request.attachments.length; i++) {
      const attachment = request.attachments[i];
      const fileUrl = await getFileUrl(attachment);
      
      // Chercher les métadonnées correspondantes
      const metadata = request.attachment_metadata?.find((meta: any) => 
        meta.filename === attachment || meta.originalName === attachment.split('/').pop()
      );
      
      const displayName = metadata?.displayName || attachment.split('/').pop() || `Fichier ${i + 1}`;
      const fileName = attachment.split('/').pop() || `Fichier ${i + 1}`;
      
      // Vérifier si c'est une image
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment);
      
      if (isImage) {
        try {
          const base64 = await getImageBase64(fileUrl);
          if (base64) {
            // Nouvelle page pour chaque image
            doc.addPage();
            currentY = 20;
            
            // Ajouter le nom personnalisé
            doc.setFontSize(14);
            doc.text(`Image: ${displayName}`, 20, currentY);
            currentY += 15;
            
            // Ajouter le nom du fichier original
            doc.setFontSize(10);
            doc.text(`Fichier original: ${fileName}`, 20, currentY);
            currentY += 10;
            
            // Ajouter le lien avec gestion des retours à la ligne
            doc.setFontSize(8);
            const splitLink = doc.splitTextToSize(`Lien: ${fileUrl}`, 170);
            doc.text(splitLink, 20, currentY);
            currentY += splitLink.length * 4 + 10;
            
            // Ajouter l'image (prendre toute la largeur moins les marges)
            const imgWidth = 170; // Largeur de page (210) - marges (20 de chaque côté)
            const imgHeight = 120; // Hauteur proportionnelle
            
            doc.addImage(base64, 'JPEG', 20, currentY, imgWidth, imgHeight);
          } else {
            // Si l'image ne peut pas être chargée
            doc.addPage();
            currentY = 20;
            doc.setFontSize(12);
            doc.text(`${displayName} (image non disponible)`, 20, currentY);
            currentY += 10;
            doc.setFontSize(8);
            const splitLink = doc.splitTextToSize(`Lien: ${fileUrl}`, 170);
            doc.text(splitLink, 20, currentY);
          }
        } catch (error) {
          console.error('Error adding image to PDF:', error);
          doc.addPage();
          currentY = 20;
          doc.setFontSize(12);
          doc.text(`${displayName} (erreur de chargement)`, 20, currentY);
          currentY += 10;
          doc.setFontSize(8);
          const splitLink = doc.splitTextToSize(`Lien: ${fileUrl}`, 170);
          doc.text(splitLink, 20, currentY);
        }
      } else {
        // Pour les fichiers non-image, afficher juste le nom
        doc.text(`${fileName} (fichier joint)`, 20, currentY);
        currentY += 10;
      }
    }
  }
  
  // Télécharger le PDF
  doc.save(`demande-renovation-${request.id.slice(-6)}.pdf`);
};

export const exportRequestsToCSV = (requests: RenovationRequest[]) => {
  const csvData = requests.map(request => ({
    'Référence': `#${request.id.slice(-6)}`,
    'Date': new Date(request.created_at || request.createdAt || '').toLocaleDateString('fr-CH'),
    'Statut': getStatusLabel(request.status),
    'Nom': request.name,
    'Email': request.email,
    'Téléphone': request.phone || '-',
    'Code postal': request.postal_code || request.postalCode || '-',
    'Type de rénovation': request.renovation_type || request.renovationType || '-',
    'Type de bâtiment': request.building_type || request.buildingType || '-',
    'Délai': request.deadline || '-',
    'Budget': request.budget || '-',
    'Description': request.description || '-'
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(csvData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Demandes');
  
  XLSX.writeFile(workbook, `demandes-renovation-${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportRequestsToExcel = (requests: RenovationRequest[]) => {
  const excelData = requests.map(request => ({
    'Référence': `#${request.id.slice(-6)}`,
    'Date': new Date(request.created_at || request.createdAt || '').toLocaleDateString('fr-CH'),
    'Statut': getStatusLabel(request.status),
    'Nom': request.name,
    'Email': request.email,
    'Téléphone': request.phone || '-',
    'Adresse': request.address || '-',
    'Code postal': request.postal_code || request.postalCode || '-',
    'Type de rénovation': request.renovation_type || request.renovationType || '-',
    'Type de bâtiment': request.building_type || request.buildingType || '-',
    'Type de surface': request.surface_type || request.surfaceType || '-',
    'Délai': request.deadline || '-',
    'Budget': request.budget || '-',
    'Matériaux': request.materials_needed || request.materialsNeeded || '-',
    'Date préférée': request.preferred_date ? new Date(request.preferred_date).toLocaleDateString('fr-CH') : '-',
    'Description': request.description || '-',
    'Nb pièces jointes': request.attachments?.length || 0
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Demandes de Rénovation');
  
  // Ajuster la largeur des colonnes
  const colWidths = [
    { wch: 12 }, // Référence
    { wch: 12 }, // Date
    { wch: 12 }, // Statut
    { wch: 20 }, // Nom
    { wch: 25 }, // Email
    { wch: 15 }, // Téléphone
    { wch: 30 }, // Adresse
    { wch: 10 }, // Code postal
    { wch: 20 }, // Type rénovation
    { wch: 15 }, // Type bâtiment
    { wch: 15 }, // Type surface
    { wch: 12 }, // Délai
    { wch: 15 }, // Budget
    { wch: 20 }, // Matériaux
    { wch: 12 }, // Date préférée
    { wch: 50 }, // Description
    { wch: 10 }  // Nb pièces jointes
  ];
  
  worksheet['!cols'] = colWidths;
  
  XLSX.writeFile(workbook, `demandes-renovation-${new Date().toISOString().split('T')[0]}.xlsx`);
};

const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    pending: "En attente",
    approved: "Approuvé",
    "in-progress": "En cours",
    completed: "Terminé",
    rejected: "Rejeté"
  };
  return statusLabels[status] || status;
};