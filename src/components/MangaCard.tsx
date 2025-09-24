import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, BookOpen, Play } from "lucide-react";

interface MangaCardProps {
  id: string;
  title: string;
  cover: string;
  rating: number;
  chapters: number;
  status: "ongoing" | "completed" | "hiatus";
  genre: string[];
  description: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  onRead?: (id: string) => void;
}

export function MangaCard({
  id,
  title,
  cover,
  rating,
  chapters,
  status,
  genre,
  description,
  isFavorite = false,
  onFavoriteToggle,
  onRead,
}: MangaCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusColors = {
    ongoing: "bg-green-500/20 text-green-400 border-green-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    hiatus: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };

  return (
    <Card
      className="group relative overflow-hidden bg-gradient-card border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 hover:scale-105 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onRead?.(id)}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={cover}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Status badge */}
        <Badge
          className={`absolute top-2 left-2 ${statusColors[status]} backdrop-blur-sm`}
          variant="outline"
        >
          {status}
        </Badge>
        
        {/* Favorite button */}
        <Button
          size="icon"
          variant="manga-ghost"
          className={`absolute top-2 right-2 backdrop-blur-sm ${
            isFavorite ? "text-red-400" : "text-manga-text-muted"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle?.(id);
          }}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
        </Button>
        
        {/* Play button overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button size="lg" variant="manga" className="rounded-full">
            <Play className="h-5 w-5 mr-2" />
            Ler Agora
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-manga-text-primary font-semibold text-sm line-clamp-2 flex-1">
            {title}
          </h3>
          <div className="flex items-center gap-1 ml-2">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-xs text-manga-text-secondary">{rating}</span>
          </div>
        </div>
        
        <p className="text-manga-text-muted text-xs line-clamp-2 mb-3">
          {description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3 text-manga-text-secondary" />
            <span className="text-xs text-manga-text-secondary">
              {chapters} capítulos
            </span>
          </div>
          
          <div className="flex gap-1">
            {genre.slice(0, 2).map((g) => (
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
      </CardContent>
    </Card>
  );
}