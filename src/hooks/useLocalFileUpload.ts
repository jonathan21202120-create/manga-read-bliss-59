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

            // In a real implementation, this would be sent to a server endpoint
            // For now, we'll create a local URL and store the file data
            const fileData = fileReader.result as string;
            
            // Create a blob URL for immediate use
            const blob = new Blob([file], { type: file.type });
            const localUrl = URL.createObjectURL(blob);
            
            // Simulate server response
            setTimeout(() => {
              setUploadProgress(100);
              
              toast({
                title: "Upload concluído!",
                description: "Arquivo enviado com sucesso.",
              });

              // Return the local URL that can be used immediately
              resolve({
                url: localUrl,
                path: filePath,
              });
            }, 1000);

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
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress((i / files.length) * 100);
      
      const result = await uploadFile(file, {
        ...options,
        folder: options.folder ? `${options.folder}/chapter-${i + 1}` : `chapter-${i + 1}`,
      });
      
      if (result) {
        results.push(result);
      }
    }
    
    return results;
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