import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrendingUp, Star, Eye } from "lucide-react";

interface TopManga {
  id: string;
  title: string;
  cover: string;
  rating: number;
  readCount: number;
  rank: number;
  genre: string[];
}

interface TopMangaDropdownProps {
  topMangas: TopManga[];
  onRead?: (id: string) => void;
}

export function TopMangaDropdown({ topMangas, onRead }: TopMangaDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="manga-outline" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Top 10 Mais Lidos
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 max-h-96 overflow-y-auto bg-manga-surface border border-border/50 shadow-elevated z-50"
        align="end"
      >
        <DropdownMenuLabel className="text-manga-text-primary font-semibold">
          📈 Top 10 Mais Lidos da Semana
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        
        {topMangas.map((manga) => (
          <DropdownMenuItem
            key={manga.id}
            className="p-3 cursor-pointer hover:bg-manga-surface-elevated focus:bg-manga-surface-elevated"
            onClick={() => onRead?.(manga.id)}
          >
            <div className="flex items-center gap-3 w-full">
              {/* Rank */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  manga.rank <= 3
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                    : "bg-gradient-to-r from-manga-primary to-manga-secondary"
                }`}
              >
                {manga.rank}
              </div>

              {/* Cover */}
              <img
                src={manga.cover}
                alt={manga.title}
                className="w-10 h-14 object-cover rounded flex-shrink-0"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-manga-text-primary text-sm line-clamp-1 mb-1">
                  {manga.title}
                </h4>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-manga-text-secondary">
                      {manga.rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-manga-text-secondary" />
                    <span className="text-xs text-manga-text-secondary">
                      {manga.readCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  {manga.genre.slice(0, 2).map((g) => (
                    <Badge
                      key={g}
                      variant="secondary"
                      className="text-xs px-1.5 py-0.5 bg-manga-surface-elevated text-manga-text-secondary border-border/30"
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}