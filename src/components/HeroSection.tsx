import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Star, BookOpen, TrendingUp } from "lucide-react";

interface HeroSectionProps {
  featuredManga?: {
    id: string;
    title: string;
    cover: string;
    rating: number;
    chapters: number;
    status: string;
    genre: string[];
    description: string;
    readCount: number;
  };
  onRead?: (id: string) => void;
}

export function HeroSection({ featuredManga, onRead }: HeroSectionProps) {
  if (!featuredManga) return null;
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={featuredManga.cover}
          alt={`Capa de ${featuredManga.title}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-2xl space-y-6">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <Badge className="bg-manga-primary/20 text-manga-primary border-manga-primary/30 backdrop-blur-sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              Mais Lido da Semana
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 backdrop-blur-sm">
              {featuredManga.status === 'ongoing' ? 'Em Andamento' : 
               featuredManga.status === 'completed' ? 'Completo' : 'Em Pausa'}
            </Badge>
          </div>
          
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-manga-text-primary leading-tight">
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              {featuredManga.title}
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-lg text-manga-text-secondary leading-relaxed">
            {featuredManga.description}
          </p>
          
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-manga-text-secondary">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span>{featuredManga.rating}/10</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{featuredManga.chapters} Capítulos</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                featuredManga.status === 'ongoing' ? 'bg-green-400' : 
                featuredManga.status === 'completed' ? 'bg-blue-400' : 'bg-yellow-400'
              }`}></span>
              <span>
                {featuredManga.status === 'ongoing' ? 'Em Andamento' : 
                 featuredManga.status === 'completed' ? 'Completo' : 'Em Pausa'}
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              size="lg" 
              variant="manga" 
              className="text-base"
              onClick={() => onRead?.(featuredManga.id)}
            >
              <Play className="h-5 w-5 mr-2" />
              Começar a Ler
            </Button>
            <Button size="lg" variant="manga-outline" className="text-base">
              Ver Biblioteca
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute bottom-10 right-10 w-20 h-20 bg-manga-primary/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-20 right-1/4 w-32 h-32 bg-manga-secondary/10 rounded-full blur-2xl animate-pulse delay-1000" />
    </section>
  );
}