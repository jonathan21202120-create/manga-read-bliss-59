import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Star, BookOpen, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-manga.jpg";

interface HeroManga {
  id: string;
  title: string;
  cover_url: string;
  description: string;
  rating: number;
  status: string;
  total_reads: number;
}

export function HeroSection() {
  const [featuredManga, setFeaturedManga] = useState<HeroManga | null>(null);

  useEffect(() => {
    fetchDailyFeaturedManga();
  }, []);

  const fetchDailyFeaturedManga = async () => {
    try {
      // Calcular o dia da semana (0-6) para rotação consistente
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      const { data, error } = await supabase
        .from('mangas')
        .select('id, title, cover_url, description, rating, status, total_reads')
        .eq('adult_content', false) // Apenas obras normais
        .order('total_reads', { ascending: false })
        .limit(7); // Top 7 para rotação semanal
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Selecionar manga baseado no dia da semana
        const selectedManga = data[dayOfWeek % data.length];
        setFeaturedManga(selectedManga);
      }
    } catch (error) {
      console.error('Error fetching featured manga:', error);
      setFeaturedManga(null);
    }
  };
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={featuredManga?.cover_url || heroImage}
          alt={featuredManga?.title || "Featured Manga"}
          className="w-full h-full object-cover object-center"
          style={{ objectPosition: "center 30%" }}
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
              Em Alta
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 backdrop-blur-sm">
              Novo Capítulo
            </Badge>
          </div>
          
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-manga-text-primary leading-tight">
            {featuredManga ? (
              <>
                Destaque de
                <span className="block bg-gradient-primary bg-clip-text text-transparent">
                  {featuredManga.title}
                </span>
              </>
            ) : (
              <>
                Descubra Seus
                <span className="block bg-gradient-primary bg-clip-text text-transparent">
                  Mangás Favoritos
                </span>
              </>
            )}
          </h1>
          
          {/* Description */}
          <p className="text-lg text-manga-text-secondary leading-relaxed">
            {featuredManga?.description || 
             "Mergulhe no universo dos mangás com nossa plataforma de leitura. Milhares de títulos, interface otimizada e experiência imersiva te aguardam."}
          </p>
          
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-manga-text-secondary">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span>{featuredManga?.rating || 9.2}/10</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{featuredManga?.total_reads ? `${featuredManga.total_reads.toLocaleString()} leituras` : "156 Capítulos"}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                featuredManga?.status === 'completed' ? 'bg-blue-400' : 
                featuredManga?.status === 'hiatus' ? 'bg-yellow-400' : 'bg-green-400'
              }`}></span>
              <span>{
                featuredManga?.status === 'completed' ? 'Completo' : 
                featuredManga?.status === 'hiatus' ? 'Hiato' : 'Em Andamento'
              }</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" variant="manga" className="text-base">
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