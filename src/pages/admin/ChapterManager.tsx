import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useWasabiUpload } from "@/hooks/useWasabiUpload";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Upload,
  Eye,
  Calendar,
  FileImage
} from "lucide-react";
import mangaCoverFallback from "@/assets/manga-cover-1.jpg";

interface Chapter {
  id: string;
  number: number;
  title: string;
  pages: number;
  publishDate: string;
  views: number;
  status: "published" | "draft";
  pageUrls?: string[];
}

interface MangaInfo {
  id: string;
  title: string;
  cover: string;
}

export default function ChapterManager() {
  const { mangaId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { uploadMultipleFiles, deleteFile, isUploading } = useWasabiUpload();
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [mangaInfo, setMangaInfo] = useState<MangaInfo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isAiSorting, setIsAiSorting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  const [newChapter, setNewChapter] = useState({
    number: 1,
    title: "",
    status: "draft" as "published" | "draft"
  });

  // Fetch manga and chapters data
  useEffect(() => {
    const fetchData = async () => {
      if (!mangaId) return;

      setIsLoading(true);
      try {
        // Fetch manga info
        const { data: mangaData, error: mangaError } = await supabase
          .from('mangas')
          .select('id, title, cover_url')
          .eq('id', mangaId)
          .single();

        if (mangaError) throw mangaError;

        setMangaInfo({
          id: mangaData.id,
          title: mangaData.title,
          cover: mangaData.cover_url || mangaCoverFallback
        });

        // Fetch chapters
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('manga_id', mangaId)
          .order('chapter_number', { ascending: false });

        if (chaptersError) throw chaptersError;

        const transformedChapters: Chapter[] = chaptersData?.map(chapter => ({
          id: chapter.id,
          number: chapter.chapter_number,
          title: chapter.title,
          pages: chapter.page_count,
          publishDate: chapter.release_date,
          views: 0, // Will be implemented later
          status: chapter.pages_urls && chapter.pages_urls.length > 0 ? "published" : "draft",
          pageUrls: chapter.pages_urls || []
        })) || [];

        setChapters(transformedChapters);
        
        // Set next chapter number
        const maxChapterNumber = Math.max(...transformedChapters.map(c => c.number), 0);
        setNewChapter(prev => ({
          ...prev,
          number: maxChapterNumber + 1
        }));

      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [mangaId]);

  // Função para ordenar arquivos por nome (numérico quando possível)
  const sortFilesByName = (files: File[]): File[] => {
    return files.sort((a, b) => {
      // Extrair números do nome dos arquivos
      const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
      
      // Se ambos têm números, ordenar numericamente
      if (numA && numB && numA !== numB) {
        return numA - numB;
      }
      
      // Caso contrário, ordenar alfabeticamente
      return a.name.localeCompare(b.name);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const sortedFiles = sortFilesByName(files);
    
    // Mesclar com arquivos existentes se houver
    const mergedFiles = [...selectedFiles, ...sortedFiles];
    const uniqueFiles = Array.from(new Set(mergedFiles.map(f => f.name)))
      .map(name => mergedFiles.find(f => f.name === name)!);
    
    setSelectedFiles(sortFilesByName(uniqueFiles));
    
    if (files.length > 0) {
      toast({
        title: "Imagens adicionadas",
        description: `${files.length} imagem(ns) adicionada(s) e ordenada(s) automaticamente`
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      const sortedFiles = sortFilesByName(files);
      
      // Mesclar com arquivos existentes se houver
      const mergedFiles = [...selectedFiles, ...sortedFiles];
      const uniqueFiles = Array.from(new Set(mergedFiles.map(f => f.name)))
        .map(name => mergedFiles.find(f => f.name === name)!);
      
      setSelectedFiles(sortFilesByName(uniqueFiles));
      
      toast({
        title: "Imagens adicionadas",
        description: `${files.length} imagem(ns) adicionada(s) e ordenada(s) automaticamente`
      });
    } else {
      toast({
        title: "Aviso",
        description: "Por favor, arraste apenas arquivos de imagem",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Imagem removida",
      description: "A imagem foi removida da lista"
    });
  };

  const handleCreateChapter = async () => {
    if (!newChapter.title || selectedFiles.length === 0 || !mangaId) {
      toast({
        title: "Erro",
        description: "Preencha o título e faça upload das páginas",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload pages to storage
      const uploadResults = await uploadMultipleFiles(selectedFiles, {
        folder: 'manga-pages',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeBytes: 10 * 1024 * 1024 // 10MB per image
      });

      if (uploadResults.length === 0) {
        toast({
          title: "Erro",
          description: "Falha no upload das páginas",
          variant: "destructive"
        });
        return;
      }

      // Validar que nenhuma URL é blob ou inválida
      const pageUrls = uploadResults
        .map(result => result.url)
        .filter(url => url && !url.startsWith('blob:') && !url.startsWith('file:'));
      
      if (pageUrls.length !== uploadResults.length) {
        toast({
          title: "Erro",
          description: "Algumas páginas não foram enviadas corretamente. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Create chapter in database
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          manga_id: mangaId,
          chapter_number: newChapter.number,
          title: newChapter.title,
          page_count: selectedFiles.length,
          pages_urls: pageUrls,
          release_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;

      const newChapterData: Chapter = {
        id: data.id,
        number: data.chapter_number,
        title: data.title,
        pages: data.page_count,
        publishDate: data.release_date,
        views: 0,
        status: "published",
        pageUrls: data.pages_urls
      };

      setChapters(prev => [newChapterData, ...prev]);
      setIsDialogOpen(false);
      setSelectedFiles([]);
      setNewChapter({
        number: newChapter.number + 1,
        title: "",
        status: "draft"
      });

      toast({
        title: "Sucesso",
        description: "Capítulo criado com sucesso!"
      });
    } catch (error: any) {
      console.error('Error creating chapter:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar capítulo: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteChapter = async () => {
    if (!chapterToDelete) return;

    try {
      // Buscar URLs das páginas do capítulo antes de deletar
      const chapter = chapters.find(c => c.id === chapterToDelete);
      
      if (chapter?.pageUrls && chapter.pageUrls.length > 0) {
        // Deletar cada imagem do R2
        const deletePromises = chapter.pageUrls.map(async (url) => {
          try {
            // Extrair o caminho do arquivo da URL
            // Exemplo: https://arquivos.culto-demoniaco.online/culto-do-demonio-celestial/manga-pages/arquivo.jpg
            // Resultado: manga-pages/arquivo.jpg
            const urlParts = url.split('/');
            const folderAndFile = urlParts.slice(-2).join('/'); // Pega as últimas 2 partes
            
            console.log('Deletando arquivo:', folderAndFile);
            await deleteFile(folderAndFile);
          } catch (error) {
            console.error('Erro ao deletar imagem:', url, error);
          }
        });
        
        await Promise.all(deletePromises);
      }

      // Deletar registro do banco de dados
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterToDelete);

      if (error) throw error;

      setChapters(prev => prev.filter(c => c.id !== chapterToDelete));
      toast({
        title: "Sucesso",
        description: "Capítulo e imagens removidos com sucesso!"
      });
    } catch (error: any) {
      console.error('Error deleting chapter:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover capítulo.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setChapterToDelete(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const chapter = chapters.find(c => c.id === id);
    if (!chapter) return;

    const newStatus = chapter.status === "published" ? "draft" : "published";
    
    // For now, we'll just update the local state
    // In a real implementation, you might want to add a status column to the chapters table
    setChapters(prev => prev.map(ch => 
      ch.id === id 
        ? { ...ch, status: newStatus }
        : ch
    ));

    toast({
      title: "Status atualizado",
      description: `Capítulo marcado como ${newStatus === "published" ? "publicado" : "rascunho"}.`
    });
  };

  const handleAiSort = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Atenção",
        description: "Carregue pelo menos uma imagem antes de usar a IA.",
        variant: "destructive"
      });
      return;
    }

    if (!mangaInfo) {
      toast({
        title: "Erro",
        description: "Informações do manga não carregadas",
        variant: "destructive"
      });
      return;
    }

    setIsAiSorting(true);
    toast({
      title: "🔍 Sistema DUAL-AI ativado",
      description: `Analisando ${selectedFiles.length} imagens de "${mangaInfo.title}" Cap. ${newChapter.number} em duas etapas...`,
      duration: 5000
    });

    try {
      // Converter imagens para base64
      const imagesData = await Promise.all(
        selectedFiles.map(async (file) => {
          return new Promise<{ name: string; data: string }>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                name: file.name,
                data: reader.result as string
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      console.log('📤 Enviando para DUAL-AI System:', { 
        mangaTitle: mangaInfo.title, 
        chapter: newChapter.number,
        totalImages: imagesData.length 
      });

      // Chamar edge function com sistema dual-AI
      const { data, error } = await supabase.functions.invoke('sort-manga-pages', {
        body: { 
          images: imagesData,
          mangaTitle: mangaInfo.title,
          chapterNumber: newChapter.number
        }
      });

      if (error) {
        console.error('❌ Erro da edge function:', error);
        throw error;
      }

      console.log('📥 Resposta do DUAL-AI:', data);

      if (data?.order && Array.isArray(data.order)) {
        const confidence = data.confidence || 0;
        const status = data.status || '⚠️ Status desconhecido';
        const reasoning = data.reasoning || '';
        const warnings = data.warnings || [];
        
        console.log('📊 Status:', status);
        console.log('🎯 Confiança:', confidence);
        console.log('💭 Raciocínio:', reasoning);
        if (warnings.length > 0) {
          console.log('⚠️ Avisos:', warnings);
        }

        // Reorganizar arquivos conforme a ordem retornada pela IA
        const orderedFiles: File[] = [];
        const unmatchedFiles: File[] = [];
        
        // Mapear os arquivos na ordem sugerida pela IA
        for (const name of data.order) {
          const file = selectedFiles.find(f => f.name === name);
          if (file) {
            orderedFiles.push(file);
          } else {
            console.warn(`⚠️ Arquivo não encontrado: ${name}`);
          }
        }
        
        // Adicionar arquivos que não foram mencionados pela IA (para não perder nada)
        for (const file of selectedFiles) {
          if (!orderedFiles.includes(file)) {
            unmatchedFiles.push(file);
            console.warn(`⚠️ Arquivo não ordenado pela IA: ${file.name}`);
          }
        }
        
        // Verificar se a IA conseguiu ordenar a maioria
        if (orderedFiles.length >= selectedFiles.length / 2) {
          setSelectedFiles([...orderedFiles, ...unmatchedFiles]);
          
          const confidencePercent = Math.round(confidence * 100);
          
          // Usar o status retornado pela IA diretamente
          let title = status;
          let message = `${orderedFiles.length}/${selectedFiles.length} páginas organizadas (${confidencePercent}% confiança)`;
          
          if (unmatchedFiles.length > 0) {
            message += `\n${unmatchedFiles.length} páginas mantidas no final`;
          }
          
          if (warnings.length > 0) {
            message += `\n⚠️ ${warnings[0]}`;
          }

          // Determinar tipo de toast baseado no status
          const toastConfig: any = {
            description: message,
            duration: status.includes('✅') ? 6000 : status.includes('⚠️') ? 8000 : 10000
          };
          
          if (status.includes('✅')) {
            toast({
              title,
              ...toastConfig
            });
          } else if (status.includes('⚠️')) {
            toast({
              title,
              ...toastConfig,
              variant: "default"
            });
          } else {
            toast({
              title,
              ...toastConfig,
              variant: "destructive"
            });
          }

          // Se confiança baixa ou avisos, mostrar raciocínio
          if ((confidence < 0.85 || warnings.length > 0) && reasoning) {
            console.log('💭 Raciocínio detalhado:', reasoning);
            setTimeout(() => {
              toast({
                title: "💭 Análise Detalhada do DUAL-AI",
                description: reasoning.substring(0, 200) + (reasoning.length > 200 ? '...' : ''),
                duration: 10000
              });
            }, 1500);
          }
        } else {
          throw new Error(`IA conseguiu ordenar apenas ${orderedFiles.length} de ${selectedFiles.length} páginas. Status: ${status}`);
        }
      } else {
        throw new Error('Resposta inválida da IA');
      }
    } catch (error: any) {
      console.error('❌ Erro ao organizar com IA:', error);
      toast({
        title: "❌ Erro na organização",
        description: error.message || "Não foi possível organizar as páginas. Tente ordenar manualmente ou com menos imagens.",
        variant: "destructive",
        duration: 8000
      });
    } finally {
      setIsAiSorting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate("/admin")}
            className="border-border/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
            <div className="flex items-center gap-4 flex-1">
              {mangaInfo ? (
                <>
                  <img 
                    src={mangaInfo.cover} 
                    alt={mangaInfo.title}
                    className="w-16 h-20 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = mangaCoverFallback;
                    }}
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-manga-text-primary">
                      Gerenciar Capítulos
                    </h1>
                    <p className="text-manga-text-secondary">
                      {mangaInfo.title} • {chapters.length} capítulos
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-manga-text-primary">
                    Carregando...
                  </h1>
                </div>
              )}
            </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Capítulo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-manga-surface border-border/50 max-w-2xl">
              <DialogHeader className="relative">
                <DialogTitle className="text-manga-text-primary">Criar Novo Capítulo</DialogTitle>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAiSort}
                  disabled={isAiSorting || selectedFiles.length === 0}
                  className="absolute top-0 right-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full px-3 py-1 text-xs shadow-lg hover:shadow-xl transition-all"
                  title="Organizar páginas com IA"
                >
                  {isAiSorting ? "🔄" : "🧠"} IA
                </Button>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chapter-number" className="text-manga-text-secondary">
                      Número do Capítulo
                    </Label>
                    <Input
                      id="chapter-number"
                      type="number"
                      value={newChapter.number}
                      onChange={(e) => setNewChapter(prev => ({ ...prev, number: parseInt(e.target.value) }))}
                      className="bg-manga-surface-elevated border-border/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-manga-text-secondary">Status</Label>
                    <select 
                      value={newChapter.status}
                      onChange={(e) => setNewChapter(prev => ({ ...prev, status: e.target.value as "published" | "draft" }))}
                      className="w-full h-10 px-3 rounded-md bg-manga-surface-elevated border border-border/50 text-manga-text-primary"
                    >
                      <option value="draft">Rascunho</option>
                      <option value="published">Publicado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chapter-title" className="text-manga-text-secondary">
                    Título do Capítulo
                  </Label>
                  <Input
                    id="chapter-title"
                    value={newChapter.title}
                    onChange={(e) => setNewChapter(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Digite o título do capítulo"
                    className="bg-manga-surface-elevated border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-manga-text-secondary">
                    Páginas do Capítulo
                  </Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 transition-all ${
                      isDragging 
                        ? 'border-manga-primary bg-manga-primary/10 scale-[1.02]' 
                        : 'border-border/50 hover:border-manga-primary/50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <Upload className={`h-12 w-12 mx-auto mb-3 transition-colors ${
                        isDragging ? 'text-manga-primary' : 'text-manga-text-muted'
                      }`} />
                      <p className="text-lg font-medium text-manga-text-primary mb-2">
                        {isDragging ? 'Solte as imagens aqui!' : 'Arraste e solte múltiplas imagens'}
                      </p>
                      <p className="text-sm text-manga-text-muted mb-4">
                        As imagens serão ordenadas automaticamente por nome/número
                      </p>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-manga-primary text-primary-foreground hover:opacity-90 transition-opacity">
                          <FileImage className="h-4 w-4" />
                          Escolher arquivos
                        </span>
                      </label>
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-border/30">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-manga-text-secondary">
                            {selectedFiles.length} imagem(ns) selecionada(s) (ordenadas)
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFiles([])}
                            className="text-xs h-7"
                          >
                            Limpar tudo
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                          {Array.from(selectedFiles).map((file, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-manga-surface-elevated border border-border/30">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Página ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveFile(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              <div className="mt-1 text-center">
                                <p className="text-xs font-medium text-manga-text-primary">
                                  Pág. {index + 1}
                                </p>
                                <p className="text-xs text-manga-text-muted truncate">
                                  {file.name}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateChapter} 
                    disabled={isUploading}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {isUploading ? "Enviando..." : "Criar Capítulo"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-manga-text-primary">
                {chapters.length}
              </div>
              <div className="text-sm text-manga-text-secondary">
                Total de Capítulos
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-manga-text-primary">
                {chapters.filter(c => c.status === "published").length}
              </div>
              <div className="text-sm text-manga-text-secondary">
                Publicados
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-manga-text-primary">
                {chapters.filter(c => c.status === "draft").length}
              </div>
              <div className="text-sm text-manga-text-secondary">
                Rascunhos
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-manga-text-primary">
                {chapters.reduce((sum, c) => sum + c.views, 0).toLocaleString()}
              </div>
              <div className="text-sm text-manga-text-secondary">
                Total de Visualizações
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chapters List */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-manga-text-primary">Lista de Capítulos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 text-manga-text-secondary font-medium">Cap.</th>
                    <th className="text-left p-4 text-manga-text-secondary font-medium">Título</th>
                    <th className="text-left p-4 text-manga-text-secondary font-medium">Páginas</th>
                    <th className="text-left p-4 text-manga-text-secondary font-medium">Status</th>
                    <th className="text-left p-4 text-manga-text-secondary font-medium">Visualizações</th>
                    <th className="text-left p-4 text-manga-text-secondary font-medium">Data</th>
                    <th className="text-left p-4 text-manga-text-secondary font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.map((chapter) => (
                    <tr key={chapter.id} className="border-b border-border/20 hover:bg-manga-surface-elevated/50 transition-colors">
                      <td className="p-4 font-mono text-manga-text-primary">
                        #{chapter.number}
                      </td>
                      <td className="p-4 text-manga-text-primary">
                        {chapter.title}
                      </td>
                      <td className="p-4 text-manga-text-secondary">
                        {chapter.pages} páginas
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={chapter.status === "published" ? "default" : "secondary"}
                          className={`cursor-pointer ${
                            chapter.status === "published" 
                              ? "bg-manga-primary hover:bg-manga-primary/80" 
                              : "bg-manga-secondary hover:bg-manga-secondary/80"
                          }`}
                          onClick={() => handleToggleStatus(chapter.id)}
                        >
                          {chapter.status === "published" ? "Publicado" : "Rascunho"}
                        </Badge>
                      </td>
                      <td className="p-4 text-manga-text-secondary">
                        {chapter.views.toLocaleString()}
                      </td>
                      <td className="p-4 text-manga-text-secondary">
                        {new Date(chapter.publishDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => {
                              setChapterToDelete(chapter.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este capítulo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O capítulo e todas as suas páginas serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChapter} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}