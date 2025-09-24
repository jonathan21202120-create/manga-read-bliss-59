import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Search,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";

interface MangaData {
  id: string;
  title: string;
  cover: string;
  chapters: number;
  status: "ongoing" | "completed" | "hiatus";
  views: number;
  favorites: number;
  lastUpdated: string;
}

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mangas, setMangas] = useState<MangaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch mangas from Supabase
  useEffect(() => {
    const fetchMangas = async () => {
      setIsLoading(true);
      try {
        const { data: mangasData, error: mangasError } = await supabase
          .from('mangas')
          .select(`
            id,
            title,
            cover_url,
            status,
            total_reads,
            followers,
            updated_at,
            chapters (count)
          `);

        if (mangasError) throw mangasError;

        const transformedMangas: MangaData[] = mangasData?.map(manga => ({
          id: manga.id,
          title: manga.title,
          cover: manga.cover_url || '/src/assets/manga-cover-1.jpg',
          chapters: manga.chapters?.[0]?.count || 0,
          status: manga.status as "ongoing" | "completed" | "hiatus",
          views: manga.total_reads || 0,
          favorites: manga.followers || 0,
          lastUpdated: new Date(manga.updated_at).toLocaleDateString('pt-BR')
        })) || [];

        setMangas(transformedMangas);
      } catch (error: any) {
        console.error('Error fetching mangas:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as obras.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMangas();
  }, []);

  const filteredMangas = mangas.filter(manga =>
    manga.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalMangas: mangas.length,
    totalChapters: mangas.reduce((sum, manga) => sum + manga.chapters, 0),
    totalViews: mangas.reduce((sum, manga) => sum + manga.views, 0),
    totalFavorites: mangas.reduce((sum, manga) => sum + manga.favorites, 0)
  };

  const handleDeleteManga = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mangas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMangas(prev => prev.filter(manga => manga.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Obra removida com sucesso!",
      });
    } catch (error: any) {
      console.error('Error deleting manga:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a obra.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-manga-text-primary mb-2">
              Painel Administrativo
            </h1>
            <p className="text-manga-text-secondary">
              Gerencie suas obras e capítulos
            </p>
          </div>
          
          <Link to="/admin/manga/new">
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Nova Obra
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-manga-text-secondary">
                Total de Obras
              </CardTitle>
              <BookOpen className="h-4 w-4 text-manga-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-manga-text-primary">
                {stats.totalMangas}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-manga-text-secondary">
                Total de Capítulos
              </CardTitle>
              <BookOpen className="h-4 w-4 text-manga-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-manga-text-primary">
                {stats.totalChapters.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-manga-text-secondary">
                Visualizações
              </CardTitle>
              <Eye className="h-4 w-4 text-manga-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-manga-text-primary">
                {stats.totalViews.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-manga-text-secondary">
                Favoritos
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-manga-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-manga-text-primary">
                {stats.totalFavorites.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-manga-text-muted" />
            <Input
              placeholder="Buscar obras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-manga-surface-elevated border-border/50"
            />
          </div>
        </div>

        {/* Manga List */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-manga-text-primary">Obras Cadastradas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <p className="text-manga-text-secondary">Carregando obras...</p>
              </div>
            ) : filteredMangas.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-manga-text-secondary">
                  {searchTerm ? "Nenhuma obra encontrada" : "Nenhuma obra cadastrada ainda"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-4 text-manga-text-secondary font-medium">Obra</th>
                      <th className="text-left p-4 text-manga-text-secondary font-medium">Capítulos</th>
                      <th className="text-left p-4 text-manga-text-secondary font-medium">Status</th>
                      <th className="text-left p-4 text-manga-text-secondary font-medium">Visualizações</th>
                      <th className="text-left p-4 text-manga-text-secondary font-medium">Última Atualização</th>
                      <th className="text-left p-4 text-manga-text-secondary font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMangas.map((manga) => (
                      <tr key={manga.id} className="border-b border-border/20 hover:bg-manga-surface-elevated/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={manga.cover} 
                              alt={manga.title}
                              className="w-12 h-16 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/src/assets/manga-cover-1.jpg';
                              }}
                            />
                            <div>
                              <div className="font-medium text-manga-text-primary">
                                {manga.title}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-manga-text-secondary">
                          {manga.chapters}
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant={manga.status === "ongoing" ? "default" : "secondary"}
                            className={
                              manga.status === "ongoing" ? "bg-manga-primary" : 
                              manga.status === "completed" ? "bg-green-500/20 text-green-400" :
                              "bg-orange-500/20 text-orange-400"
                            }
                          >
                            {manga.status === "ongoing" ? "Em Andamento" : 
                             manga.status === "completed" ? "Completo" : "Pausado"}
                          </Badge>
                        </td>
                        <td className="p-4 text-manga-text-secondary">
                          {manga.views.toLocaleString()}
                        </td>
                        <td className="p-4 text-manga-text-secondary">
                          {manga.lastUpdated}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Link to={`/admin/manga/${manga.id}`}>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </Link>
                            <Link to={`/admin/manga/${manga.id}/chapters`}>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                <BookOpen className="h-3 w-3" />
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleDeleteManga(manga.id)}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}