import { MangaCard } from "./MangaCard";

interface Manga {
  id: string;
  title: string;
  cover: string;
  rating: number;
  chapters: number;
  status: "ongoing" | "completed" | "hiatus";
  genre: string[];
  description: string;
  isFavorite?: boolean;
}

interface MangaGridProps {
  mangas: Manga[];
  onFavoriteToggle?: (id: string) => void;
  onRead?: (id: string) => void;
}

export function MangaGrid({ mangas, onFavoriteToggle, onRead }: MangaGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {mangas.map((manga) => (
        <MangaCard
          key={manga.id}
          {...manga}
          onFavoriteToggle={onFavoriteToggle}
          onRead={onRead}
        />
      ))}
    </div>
  );
}