import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSizeBytes?: number;
}

interface UploadResult {
  url: string;
  path: string;
}

export const useWasabiUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (
    file: File,
    options?: UploadOptions
  ): Promise<UploadResult | null> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validar tipo de arquivo
      if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${options.allowedTypes.join(', ')}`);
      }

      // Validar tamanho do arquivo
      if (options?.maxSizeBytes && file.size > options.maxSizeBytes) {
        const maxSizeMB = (options.maxSizeBytes / (1024 * 1024)).toFixed(2);
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
      }

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);
      if (options?.folder) {
        formData.append('folder', options.folder);
      }

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('upload-to-wasabi', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      console.log('Upload bem-sucedido:', data);
      return data as UploadResult;

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível fazer upload do arquivo',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const uploadMultipleFiles = async (
    files: File[],
    options?: UploadOptions
  ): Promise<UploadResult[]> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload todas as imagens em paralelo
      const uploadPromises = files.map(async (file, index) => {
        try {
          // Preparar FormData
          const formData = new FormData();
          formData.append('file', file);
          if (options?.folder) {
            formData.append('folder', options.folder);
          }

          // Obter token de autenticação
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Usuário não autenticado');
          }

          // Chamar edge function
          const { data, error } = await supabase.functions.invoke('upload-to-wasabi', {
            body: formData,
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (error) throw error;
          
          return data as UploadResult;
        } catch (error: any) {
          console.error(`Erro no upload do arquivo ${index + 1}:`, error);
          return null;
        }
      });

      // Aguardar todos os uploads completarem
      const results = await Promise.all(uploadPromises);
      
      setUploadProgress(100);
      
      // Filtrar resultados nulos (uploads que falharam)
      const successfulUploads = results.filter((result): result is UploadResult => result !== null);
      
      if (successfulUploads.length < files.length) {
        toast({
          title: 'Alguns uploads falharam',
          description: `${successfulUploads.length} de ${files.length} arquivos foram enviados com sucesso`,
          variant: 'destructive',
        });
      }

      return successfulUploads;
    } catch (error: any) {
      console.error('Erro no upload múltiplo:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível fazer upload dos arquivos',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading,
    uploadProgress,
  };
};
