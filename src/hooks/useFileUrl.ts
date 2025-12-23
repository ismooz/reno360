import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useFileUrl = () => {
  const getFileUrl = useCallback(async (attachment: string): Promise<string> => {
    if (!attachment) return '';

    if (attachment.startsWith('blob:') || attachment.startsWith('http')) {
      return attachment;
    }

    try {
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
  }, []);

  return { getFileUrl };
};
