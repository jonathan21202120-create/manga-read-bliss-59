import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { MangaGrid } from "@/components/MangaGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, Clock, Star, Filter, Search, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import mangaCover1 from "@/assets/manga-cover-1.jpg";
import mangaCover2 from "@/assets/manga-cover-2.jpg";
import mangaCover3 from "@/assets/manga-cover-3.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("trending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [mangaData, setMangaData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdultContent, setShowAdultContent] = useState(false);
  const { toast } = useToast();

  // Fetch manga data from Supabase
  useEffect(() => {
    const fetchMangas = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('mangas')
          .select('*')
          .order('total_reads', { ascending: false });
        
        if (error) throw error;
        
        // Transform data to match expected format and get real chapter count
        const transformedMangas = [];
        
        for (const manga of data || []) {
          // Get real chapter count
          const { data: chaptersData } = await supabase
            .from('chapters')
            .select('id')
            .eq('manga_id', manga.id);
          
          transformedMangas.push({
            id: manga.id,
            title: manga.title,
            cover: manga.cover_url,
            rating: manga.rating,
            chapters: chaptersData?.length || 0, // Real chapter count
            status: manga.status,
            genre: manga.genre,
            description: manga.description,
            isFavorite: favorites.includes(manga.id),
            readCount: manga.total_reads,
            adultContent: manga.adult_content
          });
        }
        
        setMangaData(transformedMangas);
      } catch (error) {
        console.error('Error fetching mangas:', error);
        // Use backup data only if Supabase fails completely
        setMangaData(backupMangaData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMangas();
  }, [favorites]);

  // Mock data backup in case Supabase fails
  const backupMangaData = [
    {
      id: "1",
      title: "Guerra dos Guerreiros",
      cover: mangaCover1,
      rating: 9.2,
      chapters: 156,
      status: "ongoing" as const,
      genre: ["Ação", "Aventura", "Fantasia"],
      description: "Uma épica batalha entre guerreiros lendários em um mundo repleto de magia e perigos.",
      isFavorite: favorites.includes("1"),
      readCount: 234000,
    },
    {
      id: "2",
      title: "Guardiã Mística",
      cover: mangaCover2,
      rating: 8.8,
      chapters: 89,
      status: "ongoing" as const,
      genre: ["Magia", "Romance", "Fantasia"],
      description: "Uma jovem descobre seus poderes mágicos e deve proteger o mundo das trevas.",
      isFavorite: favorites.includes("2"),
      readCount: 189000,
    },
    {
      id: "3",
      title: "Cyber Ninja",
      cover: mangaCover3,
      rating: 9.0,
      chapters: 134,
      status: "completed" as const,
      genre: ["Sci-Fi", "Ação", "Cyberpunk"],
      description: "Em um futuro distópico, um ninja cybernético luta contra corporações corruptas.",
      isFavorite: favorites.includes("3"),
      readCount: 156000,
    },
    // Duplicando para mostrar mais cards
    {
      id: "4",
      title: "Guerra dos Guerreiros",
      cover: mangaCover1,
      rating: 9.2,
      chapters: 156,
      status: "ongoing" as const,
      genre: ["Ação", "Aventura"],
      description: "Uma épica batalha entre guerreiros lendários.",
      isFavorite: favorites.includes("4"),
      readCount: 145000,
    },
    {
      id: "5",
      title: "Guardiã Mística",
      cover: mangaCover2,
      rating: 8.8,
      chapters: 89,
      status: "hiatus" as const,
      genre: ["Magia", "Romance"],
      description: "Poderes mágicos e proteção do mundo.",
      isFavorite: favorites.includes("5"),
      readCount: 123000,
    },
    {
      id: "6",
      title: "Cyber Ninja",
      cover: mangaCover3,
      rating: 9.0,
      chapters: 134,
      status: "completed" as const,
      genre: ["Sci-Fi", "Ação"],
      description: "Ninja cybernético em futuro distópico.",
      isFavorite: favorites.includes("6"),
      readCount: 98000,
    },
  ];

  const categories = [
    { id: "trending", label: "Em Alta", icon: TrendingUp },
    { id: "recent", label: "Recentes", icon: Clock },
    { id: "top", label: "Top Rated", icon: Star },
    ...(user?.profile?.conteudo_adulto ? [{ id: "adult", label: "Conteúdo +18", icon: Shield }] : [])
  ];

  // Top 10 mais lidos
  const topMangas = useMemo(() => {
    return [...mangaData]
      .sort((a, b) => b.readCount - a.readCount)
      .slice(0, 10)
      .map((manga, index) => ({
        ...manga,
        rank: index + 1,
      }));
  }, []);

  // Filtrar mangás baseado na busca e filtros
  const filteredMangas = useMemo(() => {
    let filtered = mangaData;

    // Filtro por categoria
    if (selectedCategory === "recent") {
      filtered = [...filtered].sort((a, b) => b.chapters - a.chapters);
    } else if (selectedCategory === "top") {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    } else if (selectedCategory === "adult") {
      filtered = filtered.filter(manga => manga.adultContent === true);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(manga => 
        manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manga.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manga.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por gêneros
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(manga => 
        selectedGenres.some(genre => manga.genre.includes(genre))
      );
    }

    // Filtro de conteúdo adulto (se não estiver na aba +18 e usuário não tem permissão)
    if (selectedCategory !== "adult" && !user?.profile?.conteudo_adulto) {
      filtered = filtered.filter(manga => !manga.adultContent);
    }

    return filtered;
  }, [searchTerm, selectedCategory, selectedGenres, mangaData, user?.profile?.conteudo_adulto]);

  // Obter todos os gêneros únicos
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    mangaData.forEach(manga => {
      manga.genre.forEach(g => genres.add(g));
    });
    return Array.from(genres).sort();
  }, []);

  const handleFavoriteToggle = (id: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id];
      
      const manga = mangaData.find(m => m.id === id);
      toast({
        title: newFavorites.includes(id) ? "Adicionado aos favoritos!" : "Removido dos favoritos",
        description: manga ? `${manga.title}` : "",
      });
      
      return newFavorites;
    });
  };

  const handleRead = (id: string) => {
    navigate(`/manga/${id}`);
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Navigation topMangas={topMangas} onRead={handleRead} />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 space-y-12">
        {/* Categories */}
        <section>
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-manga-text-primary">
                Explorar Mangás
              </h2>
              <Button 
                variant="manga-outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>

            {/* Barra de busca */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-manga-text-muted" />
              <Input
                placeholder="Buscar mangás..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-manga-surface-elevated border-border/50 focus:border-manga-primary"
              />
            </div>

            {/* Filtros avançados */}
            {showFilters && (
              <div className="bg-manga-surface-elevated p-4 rounded-lg border border-border/50">
                <h3 className="text-sm font-semibold text-manga-text-primary mb-3">Gêneros:</h3>
                <div className="flex flex-wrap gap-2">
                  {allGenres.map((genre) => (
                    <Badge
                      key={genre}
                      variant={selectedGenres.includes(genre) ? "default" : "secondary"}
                      className={`cursor-pointer transition-colors ${
                        selectedGenres.includes(genre)
                          ? "bg-manga-primary text-primary-foreground"
                          : "bg-manga-surface text-manga-text-secondary hover:bg-manga-surface-elevated"
                      }`}
                      onClick={() => handleGenreToggle(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
                {selectedGenres.length > 0 && (
                  <Button
                    variant="manga-ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() => setSelectedGenres([])}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Category Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "manga" : "manga-ghost"}
                className="flex items-center gap-2 whitespace-nowrap"
                onClick={() => setSelectedCategory(category.id)}
              >
                <category.icon className="h-4 w-4" />
                {category.label}
              </Button>
            ))}
          </div>
          
          {/* Resultados da busca */}
          {searchTerm && (
            <div className="mb-4">
              <p className="text-manga-text-secondary">
                {filteredMangas.length} resultado{filteredMangas.length !== 1 ? 's' : ''} encontrado{filteredMangas.length !== 1 ? 's' : ''} para "{searchTerm}"
              </p>
            </div>
          )}

          {/* Manga Grid */}
          <MangaGrid 
            mangas={filteredMangas}
            onFavoriteToggle={handleFavoriteToggle}
            onRead={handleRead}
          />

          {/* Mensagem quando não há resultados */}
          {filteredMangas.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-manga-text-primary mb-2">
                Nenhum mangá encontrado
              </h3>
              <p className="text-manga-text-secondary">
                Tente ajustar seus filtros ou termos de busca
              </p>
            </div>
          )}
        </section>
        
        {/* Stats Section */}
        <section className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-manga-text-primary">
            Junte-se a milhares de leitores
          </h3>
          <div className="flex justify-center gap-8 text-sm text-manga-text-secondary">
            <div>
              <div className="text-2xl font-bold text-manga-primary">50K+</div>
              <div>Mangás</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-manga-secondary">2M+</div>
              <div>Leitores</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-manga-primary">99.9%</div>
              <div>Uptime</div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/50 bg-manga-surface-elevated py-8">
        <div className="container mx-auto px-6 text-center text-manga-text-muted">
          <p>&copy; 2024 Culto do Demônio Celestial. Forjado nas chamas do entretenimento para os cultistas dos mangás.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
