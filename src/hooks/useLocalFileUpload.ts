import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  folder?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export const useLocalFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult | null> => {
    const { folder = 'uploads', maxSizeBytes = 10 * 1024 * 1024, allowedTypes = [] } = options;

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
      const filePath = `${folder}/${fileName}`;

      // Convert file to base64 for storage simulation
      const fileReader = new FileReader();
      
      return new Promise((resolve) => {
        fileReader.onload = async () => {
          try {
            setUploadProgress(50);

            // IMPORTANTE: Este hook NÃO deve ser usado para armazenamento permanente
            // Use useWasabiUpload para uploads reais
            setUploadProgress(100);
            
            toast({
              title: "Erro",
              description: "Este hook não deve ser usado. Use useWasabiUpload para uploads reais.",
              variant: "destructive",
            });

            resolve({
              url: '',
              path: filePath,
              error: 'useLocalFileUpload is deprecated - use useWasabiUpload instead'
            });

          } catch (error: any) {
            console.error('Upload error:', error);
            toast({
              title: "Erro no upload",
              description: error.message || "Erro ao enviar arquivo",
              variant: "destructive",
            });
            resolve(null);
          }
        };

        fileReader.onerror = () => {
          toast({
            title: "Erro no upload",
            description: "Erro ao processar arquivo",
            variant: "destructive",
          });
          resolve(null);
        };

        fileReader.readAsDataURL(file);
      });

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
    options: UploadOptions = {}
  ): Promise<UploadResult[]> => {
    toast({
      title: "Erro",
      description: "Este hook não deve ser usado. Use useWasabiUpload para uploads reais.",
      variant: "destructive",
    });
    return [];
  };

  const deleteFile = async (path: string): Promise<boolean> => {
    try {
      // In a real implementation, this would call a server endpoint to delete the file
      // For now, we'll just revoke the object URL if it exists
      if (path.startsWith('blob:')) {
        URL.revokeObjectURL(path);
      }

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