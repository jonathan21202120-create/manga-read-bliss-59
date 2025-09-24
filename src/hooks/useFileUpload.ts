import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  bucket: string;
  folder?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (
    file: File,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    const { bucket, folder = '', maxSizeBytes = 10 * 1024 * 1024, allowedTypes = [] } = options;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Validate file size
      if (file.size > maxSizeBytes) {
        toast({
          title: "Arquivo muito grande",
          description: `O arquivo deve ter menos de ${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
          variant: "destructive",
        });
        return null;
      }

      // Validate file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo não permitido",
          description: `Tipos permitidos: ${allowedTypes.join(', ')}`,
          variant: "destructive",
        });
        return null;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setUploadProgress(100);
      
      toast({
        title: "Upload concluído!",
        description: "Arquivo enviado com sucesso.",
      });

      return {
        url: urlData.publicUrl,
        path: filePath,
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao enviar arquivo",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadMultipleFiles = async (
    files: File[],
    options: UploadOptions
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress((i / files.length) * 100);
      
      const result = await uploadFile(file, {
        ...options,
        folder: options.folder ? `${options.folder}/${i + 1}` : `${i + 1}`,
      });
      
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  };

  const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;

      toast({
        title: "Arquivo removido",
        description: "Arquivo deletado com sucesso.",
      });

      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Erro ao deletar",
        description: error.message || "Erro ao remover arquivo",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    isUploading,
    uploadProgress,
  };
};