import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Star, Trophy } from "lucide-react";

interface RankingManga {
  id: string;
  title: string;
  cover_url: string;
  total_reads: number;
  rank: number;
}

interface RankingSectionProps {
  onRead: (id: string) => void;
}

export function RankingSection({ onRead }: RankingSectionProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [rankingData, setRankingData] = useState<RankingManga[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const periods = [
    { id: "today", label: "Hoje", icon: TrendingUp },
    { id: "week", label: "Semana", icon: Clock },
    { id: "month", label: "Mês", icon: Star },
    { id: "all", label: "Geral", icon: Trophy },
  ];

  useEffect(() => {
    fetchRankingData();
  }, [selectedPeriod]);

  const fetchRankingData = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('mangas')
        .select('id, title, cover_url, total_reads')
        .eq('adult_content', false) // Excluir conteúdo +18
        .order('total_reads', { ascending: false })
        .limit(10);

      const { data, error } = await query;
      
      if (error) throw error;

      const rankedData = (data || []).map((manga, index) => ({
        ...manga,
        rank: index + 1,
      }));

      setRankingData(rankedData);
    } catch (error) {
      console.error('Error fetching ranking:', error);
      setRankingData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-manga-text-primary">
          Rankings
        </h2>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {periods.map((period) => (
          <Button
            key={period.id}
            variant={selectedPeriod === period.id ? "manga" : "manga-ghost"}
            size="sm"
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={() => setSelectedPeriod(period.id)}
          >
            <period.icon className="h-4 w-4" />
            {period.label}
          </Button>
        ))}
      </div>

      {/* Ranking Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="aspect-[3/4] bg-manga-surface rounded-lg mb-3" />
              <div className="h-4 bg-manga-surface rounded mb-2" />
              <div className="h-3 bg-manga-surface rounded w-2/3" />
            </Card>
          ))
        ) : (
          rankingData.map((manga) => (
            <Card
              key={manga.id}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 bg-manga-surface-elevated"
              onClick={() => onRead(manga.id)}
            >
              <div className="relative">
                {/* Rank Badge */}
                <Badge 
                  className={`absolute -top-2 -left-2 z-10 ${
                    manga.rank === 1 
                      ? "bg-yellow-500 text-yellow-50" 
                      : manga.rank === 2 
                        ? "bg-gray-400 text-gray-50"
                        : manga.rank === 3
                          ? "bg-amber-600 text-amber-50" 
                          : "bg-manga-primary text-primary-foreground"
                  }`}
                >
                  #{manga.rank}
                </Badge>
                
                {/* Cover */}
                <div className="aspect-[3/4] overflow-hidden rounded-t-lg">
                  <img
                    src={manga.cover_url}
                    alt={manga.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
              
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-manga-text-primary text-sm line-clamp-2 leading-tight">
                  {manga.title}
                </h3>
                <p className="text-xs text-manga-text-secondary">
                  {manga.total_reads.toLocaleString()} leituras
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}