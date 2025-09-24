import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocalFileUpload } from "@/hooks/useLocalFileUpload";
import { ArrowLeft, Upload, X } from "lucide-react";

const availableGenres = [
  "Ação", "Aventura", "Comédia", "Drama", "Fantasia", "Horror", 
  "Romance", "Ficção Científica", "Slice of Life", "Supernatural", 
  "Thriller", "Mistério", "Esportes", "Histórico", "Militar"
];

export default function MangaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { uploadFile, isUploading } = useLocalFileUpload();
  const isEditing = id !== "new";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cover: "",
    status: "ongoing" as "ongoing" | "completed" | "hiatus",
    rating: 0,
    genres: [] as string[],
    author: "",
    year: new Date().getFullYear(),
    adult_content: false
  });

  const [selectedGenre, setSelectedGenre] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load existing manga data if editing
  useEffect(() => {
    if (isEditing && id !== "new") {
      const fetchMangaData = async () => {
        try {
          const { data, error } = await supabase
            .from('mangas')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          if (data) {
            setFormData({
              title: data.title,
              description: data.description,
              cover: data.cover_url,
              status: data.status as "ongoing" | "completed" | "hiatus",
              rating: data.rating,
              genres: data.genre || [],
              author: data.author,
              year: data.year,
              adult_content: data.adult_content || false
            });
            setCoverPreview(data.cover_url);
          }
        } catch (error) {
          console.error('Error fetching manga:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados da obra.",
            variant: "destructive"
          });
        }
      };

      fetchMangaData();
    }
  }, [id, isEditing]);

  const handleAddGenre = () => {
    if (selectedGenre && !formData.genres.includes(selectedGenre)) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, selectedGenre]
      }));
      setSelectedGenre("");
    }
  };

  const handleRemoveGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file, {
        folder: 'manga-covers',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeBytes: 5 * 1024 * 1024 // 5MB
      });

      if (result) {
        setCoverPreview(result.url);
        setFormData(prev => ({ ...prev, cover: result.url }));
        toast({
          title: "Upload concluído!",
          description: "Capa enviada com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error uploading cover:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.author) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let result;
      
      if (isEditing && id !== "new") {
        // Update existing manga
        result = await supabase
          .from('mangas')
          .update({
            title: formData.title,
            description: formData.description,
            author: formData.author,
            artist: formData.author, // Use author as artist if not specified
            cover_url: formData.cover || '',
            status: formData.status,
            genre: formData.genres,
            year: formData.year,
            rating: formData.rating,
            adult_content: formData.adult_content
          })
          .eq('id', id)
          .select();
      } else {
        // Insert new manga
        result = await supabase
          .from('mangas')
          .insert({
            title: formData.title,
            description: formData.description,
            author: formData.author,
            artist: formData.author, // Use author as artist if not specified
            cover_url: formData.cover || '',
            status: formData.status,
            genre: formData.genres,
            year: formData.year,
            rating: formData.rating,
            adult_content: formData.adult_content
          })
          .select();
      }

      const { data, error } = result;

      if (error) {
        console.error('Erro ao salvar obra:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar obra: " + error.message,
          variant: "destructive"
        });
        return;
      }

      if (!data || data.length === 0) {
        toast({
          title: "Erro",
          description: "Não foi possível confirmar se a obra foi salva",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: isEditing ? "Obra atualizada com sucesso!" : "Obra criada com sucesso!",
      });
      
      navigate("/admin");
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro inesperado ao salvar obra",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
          <div>
            <h1 className="text-3xl font-bold text-manga-text-primary">
              {isEditing ? "Editar Obra" : "Nova Obra"}
            </h1>
            <p className="text-manga-text-secondary">
              {isEditing ? "Atualize as informações da obra" : "Cadastre uma nova obra no sistema"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Cover Upload */}
            <div className="lg:col-span-1">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-manga-text-primary">Capa da Obra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-[3/4] border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center p-4">
                    {coverPreview ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={coverPreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover rounded"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => {
                            setCoverPreview("");
                            setFormData(prev => ({ ...prev, cover: "" }));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-manga-text-muted mb-2" />
                        <p className="text-sm text-manga-text-muted text-center">
                          Clique para fazer upload da capa
                        </p>
                      </>
                    )}
                  </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={isUploading}
                      className="w-full text-sm text-manga-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-manga-primary file:text-primary-foreground hover:file:opacity-90 disabled:opacity-50"
                    />
                    {isUploading && (
                      <p className="text-sm text-manga-text-secondary mt-2">
                        Enviando capa...
                      </p>
                    )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Form Fields */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-manga-text-primary">Informações da Obra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-manga-text-secondary">
                        Título *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Digite o título da obra"
                        className="bg-manga-surface-elevated border-border/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="author" className="text-manga-text-secondary">
                        Autor *
                      </Label>
                      <Input
                        id="author"
                        value={formData.author}
                        onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="Nome do autor"
                        className="bg-manga-surface-elevated border-border/50"
                        required
                      />
                    </div>
                  </div>

                  {/* Status and Year */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-manga-text-secondary">
                        Status
                      </Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value: "ongoing" | "completed" | "hiatus") => 
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger className="bg-manga-surface-elevated border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ongoing">Em Andamento</SelectItem>
                          <SelectItem value="completed">Completo</SelectItem>
                          <SelectItem value="hiatus">Hiato</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-manga-text-secondary">
                        Ano de Publicação
                      </Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        placeholder="2024"
                        className="bg-manga-surface-elevated border-border/50"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-manga-text-secondary">
                      Descrição *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva a história da obra..."
                      className="min-h-[120px] bg-manga-surface-elevated border-border/50"
                      required
                    />
                  </div>

                  {/* Genres */}
                  <div className="space-y-3">
                    <Label className="text-manga-text-secondary">Gêneros</Label>
                    
                    <div className="flex gap-2">
                      <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                        <SelectTrigger className="flex-1 bg-manga-surface-elevated border-border/50">
                          <SelectValue placeholder="Selecione um gênero" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGenres
                            .filter(genre => !formData.genres.includes(genre))
                            .map((genre) => (
                              <SelectItem key={genre} value={genre}>
                                {genre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={handleAddGenre} disabled={!selectedGenre}>
                        Adicionar
                      </Button>
                    </div>

                    {formData.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.genres.map((genre) => (
                          <Badge 
                            key={genre} 
                            variant="secondary" 
                            className="bg-manga-primary/20 text-manga-primary hover:bg-manga-primary/30 cursor-pointer"
                            onClick={() => handleRemoveGenre(genre)}
                          >
                            {genre}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Adult Content */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="adult_content"
                        checked={formData.adult_content}
                        onChange={(e) => setFormData(prev => ({ ...prev, adult_content: e.target.checked }))}
                        className="rounded border-border/50"
                      />
                      <Label htmlFor="adult_content" className="text-manga-text-secondary cursor-pointer">
                        Conteúdo Adulto (+18)
                      </Label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate("/admin")}
                      className="border-border/50"
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-gradient-primary hover:opacity-90"
                      disabled={isLoading || isUploading}
                    >
                      {isLoading ? "Salvando..." : isUploading ? "Enviando..." : (isEditing ? "Atualizar Obra" : "Criar Obra")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}