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
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const result = await uploadFile(file, options);
      if (result) {
        results.push(result);
      }
      // Atualizar progresso geral
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

    return results;
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading,
    uploadProgress,
  };
};
