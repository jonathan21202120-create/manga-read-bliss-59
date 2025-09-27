import { useState, useEffect, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { MangaGrid } from "@/components/MangaGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useAuth } from "@/contexts/AuthContext";
import { Search, BookOpen, Clock, CheckCircle, Filter, Grid, List, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Library() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // Mangá, Manhua, Manhwa, +18
  const [sortBy, setSortBy] = useState("recent"); // recent, title, progress
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [showAdultContent, setShowAdultContent] = useState(false);
  const [mangaData, setMangaData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { progress } = useReadingProgress();
  const { user } = useAuth();

  // Fetch all mangas for library
  useEffect(() => {
    const fetchLibraryMangas = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('mangas')
          .select('*')
          .order('title');

        // Filter adult content based on user permission and show toggle
        if (!showAdultContent) {
          query = query.eq('adult_content', false);
        }

        const { data, error } = await query;
        if (error) throw error;

        setMangaData(data || []);
      } catch (error) {
        console.error('Error fetching library mangas:', error);
        toast({
          title: "Erro ao carregar biblioteca",
          description: "Tente novamente mais tarde",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibraryMangas();
  }, [showAdultContent, toast]);

  // Transform reading progress to library format
  const libraryMangas = mangaData.map(manga => {
    const progressData = progress.find(p => p.mangaId === manga.id);
    return {
      id: manga.id,
      title: manga.title,
      cover: manga.cover_url,
      rating: manga.rating,
      chapters: 0, // Will be fetched separately if needed
      status: manga.status,
      genre: manga.genre,
      description: manga.description,
      isFavorite: false, // Will be determined by user favorites
      readChapters: progressData?.currentPage || 0,
      totalPages: progressData?.totalPages || 0,
      lastRead: progressData ? new Date(progressData.lastReadAt).toLocaleDateString('pt-BR') : null,
      type: manga.genre.some(g => g.toLowerCase().includes('manhwa')) ? 'manhwa' :
            manga.genre.some(g => g.toLowerCase().includes('manhua')) ? 'manhua' : 'manga',
      adultContent: manga.adult_content
    };
  });

  // Apply all filters and sorting
  const filteredAndSortedMangas = useMemo(() => {
    let filtered = libraryMangas;

    // Status filter
    if (filter === "reading") {
      filtered = filtered.filter(manga => manga.readChapters > 0 && manga.readChapters < manga.totalPages);
    } else if (filter === "completed") {
      filtered = filtered.filter(manga => manga.readChapters >= manga.totalPages && manga.totalPages > 0);
    }

    // Type filter
    if (typeFilter !== "all") {
      if (typeFilter === "adult") {
        filtered = filtered.filter(manga => manga.adultContent);
      } else {
        filtered = filtered.filter(manga => manga.type === typeFilter);
      }
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(manga => 
        manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manga.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manga.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort
    switch (sortBy) {
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "progress":
        filtered.sort((a, b) => {
          const progressA = a.totalPages > 0 ? a.readChapters / a.totalPages : 0;
          const progressB = b.totalPages > 0 ? b.readChapters / b.totalPages : 0;
          return progressB - progressA;
        });
        break;
      case "recent":
      default:
        filtered.sort((a, b) => {
          if (!a.lastRead && !b.lastRead) return 0;
          if (!a.lastRead) return 1;
          if (!b.lastRead) return -1;
          return new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime();
        });
    }

    return filtered;
  }, [libraryMangas, filter, typeFilter, searchTerm, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMangas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMangas = filteredAndSortedMangas.slice(startIndex, startIndex + itemsPerPage);

  const handleRead = (id: string) => {
    const manga = libraryMangas.find(m => m.id === id);
    toast({
      title: "Continuando leitura...",
      description: manga ? `Retomando ${manga.title}` : "",
    });
  };

  const handleFavoriteToggle = (id: string) => {
    toast({
      title: "Favorito atualizado!",
      description: "Manga removido da biblioteca",
    });
  };

  const filteredMangas = libraryMangas.filter(manga => {
    if (filter === "reading" && manga.readChapters < manga.chapters) return true;
    if (filter === "completed" && manga.readChapters >= manga.chapters) return true;
    if (filter === "all") return true;
    return false;
  }).filter(manga => 
    manga.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-manga-text-primary">Minha Biblioteca</h1>
          <p className="text-manga-text-secondary">Seus mangás salvos e progresso de leitura</p>
        </div>

        {/* Filtros avançados e busca */}
        <div className="space-y-4">
          {/* Barra de busca */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-manga-text-muted" />
            <Input
              placeholder="Buscar na biblioteca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-manga-surface-elevated border-border/50 focus:border-manga-primary"
            />
          </div>

          {/* Filtros de status */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === "all" ? "manga" : "manga-ghost"}
              onClick={() => setFilter("all")}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Todos
            </Button>
            <Button
              variant={filter === "reading" ? "manga" : "manga-ghost"}
              onClick={() => setFilter("reading")}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Lendo
            </Button>
            <Button
              variant={filter === "completed" ? "manga" : "manga-ghost"}
              onClick={() => setFilter("completed")}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Completos
            </Button>
          </div>

          {/* Filtros avançados */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Type filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-manga-text-muted" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48 bg-manga-surface-elevated border-border/50">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="manga">Mangá</SelectItem>
                  <SelectItem value="manhwa">Manhwa</SelectItem>
                  <SelectItem value="manhua">Manhua</SelectItem>
                  <SelectItem value="adult">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      Conteúdo +18
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-manga-text-muted">Ordenar:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-manga-surface-elevated border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="title">Título (A-Z)</SelectItem>
                  <SelectItem value="progress">Progresso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-manga-text-muted">Por página:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20 bg-manga-surface-elevated border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Adult content toggle */}
            {user?.profile?.conteudo_adulto && (
              <Button
                variant={showAdultContent ? "manga" : "manga-outline"}
                size="sm"
                onClick={() => setShowAdultContent(!showAdultContent)}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                {showAdultContent ? "Ocultar +18" : "Mostrar +18"}
              </Button>
            )}
          </div>

          {/* Results count */}
          <div className="flex justify-between items-center text-sm text-manga-text-secondary">
            <span>
              {filteredAndSortedMangas.length} resultado{filteredAndSortedMangas.length !== 1 ? 's' : ''} encontrado{filteredAndSortedMangas.length !== 1 ? 's' : ''}
              {searchTerm && ` para "${searchTerm}"`}
            </span>
            {totalPages > 1 && (
              <span>
                Página {currentPage} de {totalPages}
              </span>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-manga-surface-elevated p-4 rounded-lg border border-border/50">
            <h3 className="text-lg font-semibold text-manga-text-primary">Total de Mangás</h3>
            <p className="text-2xl font-bold text-manga-primary">{libraryMangas.length}</p>
          </div>
          <div className="bg-manga-surface-elevated p-4 rounded-lg border border-border/50">
            <h3 className="text-lg font-semibold text-manga-text-primary">Lendo Atualmente</h3>
            <p className="text-2xl font-bold text-manga-secondary">
              {libraryMangas.filter(m => m.readChapters < m.chapters).length}
            </p>
          </div>
          <div className="bg-manga-surface-elevated p-4 rounded-lg border border-border/50">
            <h3 className="text-lg font-semibold text-manga-text-primary">Completos</h3>
            <p className="text-2xl font-bold text-green-400">
              {libraryMangas.filter(m => m.readChapters >= m.chapters).length}
            </p>
          </div>
        </div>

        {/* Grid de mangás */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-manga-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-manga-text-secondary">Carregando biblioteca...</p>
          </div>
        ) : paginatedMangas.length > 0 ? (
          <>
            <MangaGrid 
              mangas={paginatedMangas}
              onFavoriteToggle={handleFavoriteToggle}
              onRead={handleRead}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-8">
                <Button
                  variant="manga-outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "manga" : "manga-ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10 h-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="manga-outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-manga-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-manga-text-primary mb-2">
              Nenhum mangá encontrado
            </h3>
            <p className="text-manga-text-secondary">
              {searchTerm || typeFilter !== "all" ? "Tente ajustar seus filtros" : "Comece a ler alguns mangás para vê-los aqui"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}