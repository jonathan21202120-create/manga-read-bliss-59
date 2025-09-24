import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { MangaGrid } from "@/components/MangaGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useAuth } from "@/contexts/AuthContext";
import { Search, BookOpen, Clock, CheckCircle } from "lucide-react";

export default function Library() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();
  const { progress, isLoading } = useReadingProgress();
  const { user } = useAuth();

  // Transform reading progress to library format
  const libraryMangas = progress.map(p => ({
    id: p.mangaId,
    title: p.mangaTitle,
    cover: p.mangaCoverUrl,
    rating: 0, // Not available in progress data
    chapters: p.totalPages, // Using pages as chapters for display
    status: "ongoing" as const,
    genre: [] as string[], // Not available in progress data
    description: "",
    isFavorite: true, // Assume all in progress are favorites
    readChapters: p.currentPage,
    lastRead: new Date(p.lastReadAt).toLocaleDateString('pt-BR'),
  }));

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

        {/* Filtros e busca */}
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-manga-text-muted" />
            <Input
              placeholder="Buscar na biblioteca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-manga-surface-elevated border-border/50 focus:border-manga-primary"
            />
          </div>

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
            <p className="text-manga-text-secondary">Carregando biblioteca...</p>
          </div>
        ) : filteredMangas.length > 0 ? (
          <MangaGrid 
            mangas={filteredMangas}
            onFavoriteToggle={handleFavoriteToggle}
            onRead={handleRead}
          />
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-manga-text-primary mb-2">
              Nenhum mangá encontrado
            </h3>
            <p className="text-manga-text-secondary">
              {searchTerm ? "Tente ajustar sua busca" : "Comece a ler alguns mangás para vê-los aqui"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}