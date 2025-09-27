import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  List,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Chapter {
  id: string;
  number: number;
  title: string;
  pages: string[];
}

interface Manga {
  id: string;
  title: string;
  chapters: Chapter[];
}

const MangaReader = () => {
  const { id, chapterId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateProgress, getLastReadChapter } = useReadingProgress();
  const { user } = useAuth();
  const [manga, setManga] = useState<Manga | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState<"width" | "height" | "original">("width");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('reader-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hideControlsTimeout = useRef<NodeJS.Timeout>();

  // Mock data para páginas (usando placeholders)
  const generateMockPages = (chapterNumber: number, pageCount: number = 20): string[] => {
    return Array.from({ length: pageCount }, (_, i) => 
      `https://picsum.photos/800/1200?random=${chapterNumber * 100 + i + 1}`
    );
  };

  useEffect(() => {
    const fetchMangaData = async () => {
      if (!id || !chapterId) return;

      setIsLoading(true);
      try {
        // Fetch manga and chapters from Supabase
        const { data: mangaData, error: mangaError } = await supabase
          .from('mangas')
          .select('id, title')
          .eq('id', id)
          .single();

        if (mangaError) throw mangaError;

        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('id, chapter_number, title, pages_urls')
          .eq('manga_id', id)
          .order('chapter_number', { ascending: true });

        if (chaptersError) throw chaptersError;

        const chapters: Chapter[] = chaptersData?.map(ch => ({
          id: ch.id,
          number: ch.chapter_number,
          title: ch.title,
          pages: ch.pages_urls || generateMockPages(ch.chapter_number)
        })) || [];

        // If no chapters found, generate mock data as fallback
        if (chapters.length === 0) {
          const requestedChapterNum = parseInt(chapterId);
          const maxChapters = Math.max(50, requestedChapterNum);
          
          for (let i = 1; i <= maxChapters; i++) {
            chapters.push({
              id: i.toString(),
              number: i,
              title: `Capítulo ${i}`,
              pages: generateMockPages(i)
            });
          }
        }

        const mockManga: Manga = {
          id: mangaData.id,
          title: mangaData.title,
          chapters: chapters
        };

        setManga(mockManga);
        
        const chapter = chapters.find(ch => ch.id === chapterId);
        if (chapter) {
          setCurrentChapter(chapter);
          
          // Check URL parameter for page first, then check saved progress
          const urlParams = new URLSearchParams(window.location.search);
          const pageParam = urlParams.get('page');
          if (pageParam) {
            const pageNum = parseInt(pageParam) - 1;
            if (pageNum >= 0 && pageNum < chapter.pages.length) {
              setCurrentPage(pageNum);
            }
          }
        } else {
          // Redirect to first chapter if current chapter not found
          navigate(`/manga/${id}/chapter/${chapters[0]?.id}`, { replace: true });
        }
      } catch (error) {
        console.error('Error fetching manga data:', error);
        // Fall back to mock data if error
        const requestedChapterNum = parseInt(chapterId || "1");
        const maxChapters = Math.max(50, requestedChapterNum);
        
        const chapters = [];
        for (let i = 1; i <= maxChapters; i++) {
          chapters.push({
            id: i.toString(),
            number: i,
            title: `Capítulo ${i}`,
            pages: generateMockPages(i)
          });
        }

        const mockManga: Manga = {
          id: id || "1",
          title: "Guerra dos Guerreiros",
          chapters: chapters
        };

        setManga(mockManga);
        
        const chapter = chapters.find(ch => ch.id === chapterId);
        if (chapter) {
          setCurrentChapter(chapter);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMangaData();
  }, [id, chapterId, navigate]);

  // Check for saved reading progress when component mounts and user/chapter changes
  useEffect(() => {
    if (user && id && chapterId && currentChapter && !window.location.search.includes('page=')) {
      const savedProgress = getLastReadChapter(id);
      if (savedProgress && savedProgress.chapterId === chapterId) {
        setCurrentPage(savedProgress.currentPage - 1);
        toast({
          title: "Progresso restaurado",
          description: `Continuando da página ${savedProgress.currentPage}`,
        });
      }
    }
  }, [user, id, chapterId, currentChapter, getLastReadChapter, toast]);

  // Save progress automatically when page changes
  useEffect(() => {
    if (user && id && chapterId && currentChapter && currentPage >= 0) {
      const timeoutId = setTimeout(() => {
        updateProgress(
          id,
          chapterId,
          currentPage + 1,
          currentPage >= currentChapter.pages.length - 1
        );
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [user, id, chapterId, currentChapter, currentPage, updateProgress]);

  // Auto-hide controls
  useEffect(() => {
    const resetHideTimer = () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
      
      setShowControls(true);
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const handleMouseMove = () => resetHideTimer();
    const handleKeyPress = (e: KeyboardEvent) => {
      resetHideTimer();
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNextPage();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);
    resetHideTimer();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [currentPage, currentChapter, isFullscreen]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('reader-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const getCurrentChapterIndex = () => {
    if (!manga || !currentChapter) return -1;
    return manga.chapters.findIndex(ch => ch.id === currentChapter.id);
  };

  const getPrevChapter = () => {
    if (!manga || !currentChapter) return null;
    const currentIndex = getCurrentChapterIndex();
    return currentIndex > 0 ? manga.chapters[currentIndex - 1] : null;
  };

  const getNextChapter = () => {
    if (!manga || !currentChapter) return null;
    const currentIndex = getCurrentChapterIndex();
    return currentIndex < manga.chapters.length - 1 ? manga.chapters[currentIndex + 1] : null;
  };

  const goToChapter = (newChapterId: string) => {
    navigate(`/manga/${id}/chapter/${newChapterId}`);
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else {
      const prevChapter = getPrevChapter();
      if (prevChapter) {
        navigate(`/manga/${id}/chapter/${prevChapter.id}?page=${prevChapter.pages.length}`);
      }
    }
  };

  const goToNextPage = () => {
    if (currentChapter && currentPage < currentChapter.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      const nextChapter = getNextChapter();
      if (nextChapter) {
        navigate(`/manga/${id}/chapter/${nextChapter.id}`);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getImageStyle = () => {
    const baseStyle: React.CSSProperties = {
      transform: `scale(${zoom / 100})`,
      transformOrigin: 'center',
      transition: 'transform 0.2s ease-in-out'
    };

    switch (fitMode) {
      case "width":
        return { ...baseStyle, width: "100%", height: "auto", maxHeight: "none" };
      case "height":
        return { ...baseStyle, height: "100vh", width: "auto", maxWidth: "100%" };
      case "original":
        return { ...baseStyle, width: "auto", height: "auto" };
      default:
        return baseStyle;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-manga-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-manga-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-manga-text-secondary">Carregando capítulo...</p>
        </div>
      </div>
    );
  }

  if (!currentChapter) {
    return (
      <div className="min-h-screen bg-manga-surface flex items-center justify-center">
        <Card className="bg-manga-surface-elevated border-border/50 p-8 text-center">
          <h2 className="text-xl font-bold text-manga-text-primary mb-4">Capítulo não encontrado</h2>
          <Button onClick={() => navigate("/")} variant="manga">
            <Home className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`reader-container ${isDarkMode ? 'dark' : ''} bg-manga-surface min-h-screen`}>
      {/* Top Controls */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-manga-surface/90 backdrop-blur-sm border-b border-border/50 transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="sm"
              className="text-manga-text-secondary hover:text-manga-text-primary"
            >
              <Home className="h-4 w-4 mr-2" />
              Início
            </Button>
            <Button
              onClick={() => navigate(`/manga/${id}`)}
              variant="ghost"
              size="sm"
              className="text-manga-text-secondary hover:text-manga-text-primary"
            >
              <List className="h-4 w-4 mr-2" />
              Capítulos
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-lg font-bold text-manga-text-primary">{manga?.title}</h1>
            <p className="text-sm text-manga-text-secondary">{currentChapter.title}</p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={fitMode} onValueChange={(value: "width" | "height" | "original") => setFitMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="width">Ajustar largura</SelectItem>
                <SelectItem value="height">Ajustar altura</SelectItem>
                <SelectItem value="original">Tamanho original</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              variant="ghost"
              size="sm"
              className="text-manga-text-secondary hover:text-manga-text-primary"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-manga-text-secondary min-w-[50px] text-center">
              {zoom}%
            </span>
            
            <Button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              variant="ghost"
              size="sm"
              className="text-manga-text-secondary hover:text-manga-text-primary"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => setZoom(100)}
              variant="ghost"
              size="sm"
              className="text-manga-text-secondary hover:text-manga-text-primary"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              onClick={toggleFullscreen}
              variant="ghost"
              size="sm"
              className="text-manga-text-secondary hover:text-manga-text-primary"
            >
              <Maximize className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => setIsDarkMode(!isDarkMode)}
              variant="ghost"
              size="sm"
              className="text-manga-text-secondary hover:text-manga-text-primary"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-24 pb-20">
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <img
            src={currentChapter.pages[currentPage]}
            alt={`Página ${currentPage + 1}`}
            style={getImageStyle()}
            className="max-h-[80vh] object-contain"
            loading="lazy"
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-manga-surface/90 backdrop-blur-sm border-t border-border/50 transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center justify-between p-4">
          {/* Previous Chapter Button */}
          <Button
            onClick={() => {
              const prevChapter = getPrevChapter();
              if (prevChapter) goToChapter(prevChapter.id);
            }}
            disabled={!getPrevChapter()}
            variant="ghost"
            size="sm"
            className="text-manga-text-secondary hover:text-manga-text-primary disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Cap. Anterior
          </Button>

          {/* Page Navigation */}
          <div className="flex items-center gap-4">
            <Button
              onClick={goToPrevPage}
              disabled={currentPage === 0 && !getPrevChapter()}
              variant="ghost"
              size="sm"
              className="text-manga-text-secondary hover:text-manga-text-primary disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <div className="text-sm text-manga-text-primary font-medium">
                {currentPage + 1} / {currentChapter.pages.length}
              </div>
              <div className="text-xs text-manga-text-secondary">
                Cap. {getCurrentChapterIndex() + 1} de {manga?.chapters.length || 0}
              </div>
            </div>

            <Button
              onClick={goToNextPage}
              disabled={currentPage === currentChapter.pages.length - 1 && !getNextChapter()}
              variant="ghost"
              size="sm"
              className="text-manga-text-secondary hover:text-manga-text-primary disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Next Chapter Button */}
          <Button
            onClick={() => {
              const nextChapter = getNextChapter();
              if (nextChapter) goToChapter(nextChapter.id);
            }}
            disabled={!getNextChapter()}
            variant="ghost"
            size="sm"
            className="text-manga-text-secondary hover:text-manga-text-primary disabled:opacity-50"
          >
            Próx. Cap.
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Click Areas for Navigation */}
      <div 
        className="fixed left-0 top-24 w-1/3 h-[calc(100vh-200px)] z-30 cursor-pointer"
        onClick={goToPrevPage}
        title="Página anterior"
      />
      <div 
        className="fixed right-0 top-24 w-1/3 h-[calc(100vh-200px)] z-30 cursor-pointer"
        onClick={goToNextPage}
        title="Próxima página"
      />
    </div>
  );
};

export default MangaReader;