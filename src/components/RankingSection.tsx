import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Calendar, Trophy, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RankingManga {
  id: string;
  title: string;
  cover: string;
  reads: number;
  rank: number;
}

interface RankingSectionProps {
  onRead?: (id: string) => void;
}

export function RankingSection({ onRead }: RankingSectionProps) {
  const [activeTab, setActiveTab] = useState<"today" | "week" | "month" | "all">("today");
  const [rankings, setRankings] = useState<Record<string, RankingManga[]>>({
    today: [],
    week: [],
    month: [],
    all: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const tabs = [
    { id: "today" as const, label: "Hoje", icon: Clock },
    { id: "week" as const, label: "Semana", icon: Calendar },
    { id: "month" as const, label: "Mês", icon: TrendingUp },
    { id: "all" as const, label: "Geral", icon: Trophy }
  ];

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true);
      try {
        // Fetch mangas excluding adult content by default
        const { data: mangas, error } = await supabase
          .from('mangas')
          .select('*')
          .eq('adult_content', false)
          .order('total_reads', { ascending: false })
          .limit(10);

        if (error) throw error;

        // For now, we'll use the same data for all periods
        // In a real implementation, you'd have read tracking by period
        const rankingData = (mangas || []).map((manga, index) => ({
          id: manga.id,
          title: manga.title,
          cover: manga.cover_url,
          reads: manga.total_reads + Math.floor(Math.random() * 1000), // Simulate variation
          rank: index + 1
        }));

        // Simulate different rankings for each period
        setRankings({
          today: [...rankingData].sort(() => Math.random() - 0.5).slice(0, 5),
          week: [...rankingData].slice(0, 7),
          month: [...rankingData].slice(0, 8),
          all: rankingData
        });

      } catch (error) {
        console.error('Error fetching rankings:', error);
        // Fallback with empty data
        setRankings({ today: [], week: [], month: [], all: [] });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const currentRanking = rankings[activeTab];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-manga-text-primary">Rankings</h2>
        <Badge className="bg-manga-primary/20 text-manga-primary border-manga-primary/30">
          <TrendingUp className="h-3 w-3 mr-1" />
          Mais Lidos
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "manga" : "manga-ghost"}
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Ranking Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="bg-manga-surface-elevated border-border/50 p-4 animate-pulse">
              <div className="aspect-[3/4] bg-manga-surface rounded-lg mb-3"></div>
              <div className="h-4 bg-manga-surface rounded mb-2"></div>
              <div className="h-3 bg-manga-surface rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {currentRanking.map((manga) => (
            <Card 
              key={manga.id}
              className="bg-manga-surface-elevated border-border/50 hover:border-manga-primary/50 transition-all cursor-pointer group"
              onClick={() => onRead?.(manga.id)}
            >
              <div className="relative p-3">
                {/* Rank Badge */}
                <Badge 
                  className={`absolute top-1 left-1 z-10 text-xs font-bold ${
                    manga.rank === 1 
                      ? "bg-yellow-500/90 text-black" 
                      : manga.rank === 2 
                        ? "bg-gray-400/90 text-black"
                        : manga.rank === 3 
                          ? "bg-orange-600/90 text-white"
                          : "bg-manga-primary/80 text-white"
                  }`}
                >
                  #{manga.rank}
                </Badge>

                {/* Cover Image */}
                <div className="aspect-[3/4] relative overflow-hidden rounded-lg mb-3">
                  <img
                    src={manga.cover}
                    alt={`Capa de ${manga.title}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-manga-text-primary mb-2 line-clamp-2 group-hover:text-manga-primary transition-colors">
                  {manga.title}
                </h3>

                {/* Reads */}
                <div className="flex items-center gap-1 text-xs text-manga-text-muted">
                  <Eye className="h-3 w-3" />
                  <span>{manga.reads.toLocaleString('pt-BR')} leituras</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && currentRanking.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-manga-text-muted mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-manga-text-primary mb-2">
            Nenhum dado disponível
          </h3>
          <p className="text-manga-text-secondary">
            O ranking para este período ainda não está disponível
          </p>
        </div>
      )}
    </section>
  );
}