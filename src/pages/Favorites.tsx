import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { MangaGrid } from "@/components/MangaGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Heart, Star, TrendingUp } from "lucide-react";

interface FavoriteManga {
  id: string;
  title: string;
  cover: string;
  rating: number;
  chapters: number;
  status: "ongoing" | "completed" | "hiatus";
  genre: string[];
  description: string;
  isFavorite: boolean;
  dateAdded: string;
}

export default function Favorites() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [favoriteMangas, setFavoriteMangas] = useState<FavoriteManga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user's favorite mangas
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            created_at,
            mangas (
              id,
              title,
              cover_url,
              rating,
              status,
              genre,
              description
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        const transformedFavorites: FavoriteManga[] = data?.map((fav: any) => ({
          id: fav.mangas.id,
          title: fav.mangas.title,
          cover: fav.mangas.cover_url || '/src/assets/manga-cover-1.jpg',
          rating: fav.mangas.rating || 0,
          chapters: 0, // Will be fetched separately if needed
          status: fav.mangas.status as "ongoing" | "completed" | "hiatus",
          genre: fav.mangas.genre || [],
          description: fav.mangas.description || "",
          isFavorite: true,
          dateAdded: new Date(fav.created_at).toLocaleDateString('pt-BR'),
        })) || [];

        setFavoriteMangas(transformedFavorites);
      } catch (error: any) {
        console.error('Error fetching favorites:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus favoritos.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleRead = (id: string) => {
    const manga = favoriteMangas.find(m => m.id === id);
    toast({
      title: "Iniciando leitura...",
      description: manga ? `Abrindo ${manga.title}` : "",
    });
  };

  const handleFavoriteToggle = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('manga_id', id);

      if (error) throw error;

      setFavoriteMangas(prev => prev.filter(manga => manga.id !== id));
      toast({
        title: "Removido dos favoritos",
        description: "Mangá removido da sua lista de favoritos",
      });
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover dos favoritos.",
        variant: "destructive"
      });
    }
  };

  const sortedMangas = [...favoriteMangas].sort((a, b) => {
    if (sortBy === "recent") return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "title") return a.title.localeCompare(b.title);
    return 0;
  });

  const filteredMangas = sortedMangas.filter(manga => 
    manga.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-400 fill-current" />
            <h1 className="text-3xl font-bold text-manga-text-primary">Meus Favoritos</h1>
          </div>
          <p className="text-manga-text-secondary">Seus mangás favoritos em um só lugar</p>
        </div>

        {/* Busca e ordenação */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-manga-text-muted" />
            <Input
              placeholder="Buscar favoritos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-manga-surface-elevated border-border/50 focus:border-manga-primary"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={sortBy === "recent" ? "manga" : "manga-ghost"}
              onClick={() => setSortBy("recent")}
              size="sm"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Recentes
            </Button>
            <Button
              variant={sortBy === "rating" ? "manga" : "manga-ghost"}
              onClick={() => setSortBy("rating")}
              size="sm"
            >
              <Star className="h-4 w-4 mr-2" />
              Avaliação
            </Button>
            <Button
              variant={sortBy === "title" ? "manga" : "manga-ghost"}
              onClick={() => setSortBy("title")}
              size="sm"
            >
              A-Z
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="bg-manga-surface-elevated p-6 rounded-lg border border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-manga-primary">{favoriteMangas.length}</p>
              <p className="text-sm text-manga-text-secondary">Total de Favoritos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-manga-secondary">
                {favoriteMangas.filter(m => m.status === "ongoing").length}
              </p>
              <p className="text-sm text-manga-text-secondary">Em Andamento</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">
                {favoriteMangas.filter(m => m.status === "completed").length}
              </p>
              <p className="text-sm text-manga-text-secondary">Completos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                {(favoriteMangas.reduce((acc, m) => acc + m.rating, 0) / favoriteMangas.length).toFixed(1)}
              </p>
              <p className="text-sm text-manga-text-secondary">Avaliação Média</p>
            </div>
          </div>
        </div>

        {/* Grid de mangás */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-manga-text-secondary">Carregando favoritos...</p>
          </div>
        ) : filteredMangas.length > 0 ? (
          <MangaGrid 
            mangas={filteredMangas}
            onFavoriteToggle={handleFavoriteToggle}
            onRead={handleRead}
          />
        ) : (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-manga-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-manga-text-primary mb-2">
              {searchTerm ? "Nenhum favorito encontrado" : "Nenhum favorito ainda"}
            </h3>
            <p className="text-manga-text-secondary">
              {searchTerm ? "Tente ajustar sua busca" : "Adicione alguns mangás aos seus favoritos para vê-los aqui"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}