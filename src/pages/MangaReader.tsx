import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ReaderControls } from "@/components/ReaderControls";
import ReaderSettings, { ReaderSettingsType } from "@/components/ReaderSettings";
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
  const [zoom, setZoom] = useState(1); // Changed to decimal (1 = 100%)
  const [fitMode, setFitMode] = useState<"width" | "height" | "original">("width");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from localStorage or system preference
    const saved = localStorage.getItem('reader-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [readerSettings, setReaderSettings] = useState<ReaderSettingsType>({
    readingMode: "single", // Changed default to single page
    readingDirection: "ltr",
    pagefit: "width",
    theme: "auto",
    autoScroll: false,
    scrollSpeed: 3,
    imageQuality: "high",
    transitionSpeed: 300,
    showPageNumbers: true,
    invertColors: false,
    grayscale: false,
    brightness: 100,
    contrast: 100,
  });
  const hideControlsTimeout = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

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
          pages: ch.pages_urls || generateMockPages(ch.chapter_number) // Fallback to mock if no pages
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
          // If no URL parameter and user is logged in, we'll check saved progress after the hook initializes
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
        // Continue from where the user left off
        setCurrentPage(savedProgress.currentPage - 1); // Convert to 0-based index
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
      // Save progress automatically with a small delay to avoid too many calls
      const timeoutId = setTimeout(() => {
        updateProgress(
          id,
          chapterId,
          currentPage + 1, // Convert to 1-based index
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

  // Auto-scroll for webtoon mode
  useEffect(() => {
    if (readerSettings.readingMode === "webtoon" && readerSettings.autoScroll && containerRef.current) {
      const scrollSpeed = readerSettings.scrollSpeed;
      const interval = setInterval(() => {
        const container = containerRef.current;
        if (container) {
          const scrollAmount = scrollSpeed * 10;
          container.scrollTop += scrollAmount;
          
          // Check if we've reached the end
          if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
            // Auto-advance to next chapter
            const nextChapter = getNextChapter();
            if (nextChapter) {
              goToChapter(nextChapter.id);
            }
          }
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [readerSettings.readingMode, readerSettings.autoScroll, readerSettings.scrollSpeed]);

  // Track current page in webtoon mode based on scroll
  useEffect(() => {
    if (readerSettings.readingMode === "webtoon" && currentChapter && containerRef.current) {
      const container = containerRef.current;
      
      const handleScroll = () => {
        if (!container || !currentChapter) return;
        
        const images = container.querySelectorAll('.webtoon-page');
        let newCurrentPage = 0;
        
        // Find which page is most visible
        images.forEach((img, index) => {
          const rect = img.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Check if the image is in the viewport
          if (rect.top < containerRect.height / 2 && rect.bottom > containerRect.height / 2) {
            newCurrentPage = index;
          }
        });
        
        if (newCurrentPage !== currentPage) {
          setCurrentPage(newCurrentPage);
        }
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [readerSettings.readingMode, currentChapter, currentPage]);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1); // Convert from 1-based to 0-based
  };

  const handleChapterChange = (direction: "prev" | "next") => {
    const chapter = direction === "prev" ? getPrevChapter() : getNextChapter();
    if (chapter) {
      goToChapter(chapter.id);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const handleReadingModeChange = (mode: "single" | "double" | "webtoon") => {
    setReaderSettings(prev => ({ ...prev, readingMode: mode }));
  };

  const handleFitModeChange = (mode: "width" | "height" | "original") => {
    setFitMode(mode);
  };

  const getImageStyle = () => {
    const baseStyle: React.CSSProperties = {
      transform: `scale(${zoom})`,
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
    <div 
      ref={containerRef}
      className={`reader-container ${isDarkMode ? 'dark' : ''} bg-manga-surface min-h-screen overflow-auto`}
    >
      {/* Reader Controls */}
      <ReaderControls
        currentPage={currentPage + 1} // Convert to 1-based
        totalPages={currentChapter.pages.length}
        currentChapter={getCurrentChapterIndex() + 1}
        totalChapters={manga?.chapters.length || 0}
        zoom={zoom}
        readingMode={readerSettings.readingMode}
        isDarkMode={isDarkMode}
        isFullscreen={isFullscreen}
        fitMode={fitMode}
        onPageChange={handlePageChange}
        onChapterChange={handleChapterChange}
        onZoomChange={handleZoomChange}
        onReadingModeChange={handleReadingModeChange}
        onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
        onFullscreenToggle={toggleFullscreen}
        onFitModeChange={handleFitModeChange}
        onGoHome={() => navigate("/")}
      />

      {/* Main Content Area */}
      <div className="pt-24 pb-20"> {/* Padding to account for fixed controls */}
        {readerSettings.readingMode === "webtoon" ? (
          // Webtoon Mode - Vertical scroll
          <div className="max-w-4xl mx-auto space-y-2">
            {currentChapter.pages.map((pageUrl, index) => (
              <div key={index} className="webtoon-page">
                <img
                  src={pageUrl}
                  alt={`Página ${index + 1}`}
                  style={getImageStyle()}
                  className="w-full h-auto block mx-auto"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : readerSettings.readingMode === "double" ? (
          // Double Page Mode
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <div className="flex gap-4 max-w-full">
              {currentPage > 0 && (
                <img
                  src={currentChapter.pages[currentPage - 1]}
                  alt={`Página ${currentPage}`}
                  style={getImageStyle()}
                  className="max-h-[80vh] object-contain"
                  loading="lazy"
                />
              )}
              <img
                src={currentChapter.pages[currentPage]}
                alt={`Página ${currentPage + 1}`}
                style={getImageStyle()}
                className="max-h-[80vh] object-contain"
                loading="lazy"
              />
            </div>
          </div>
        ) : (
          // Single Page Mode
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <img
              src={currentChapter.pages[currentPage]}
              alt={`Página ${currentPage + 1}`}
              style={getImageStyle()}
              className="max-h-[80vh] object-contain"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Click Areas for Navigation - Only for single/double page modes */}
      {readerSettings.readingMode !== "webtoon" && (
        <>
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
        </>
      )}
    </div>
  );
};

export default MangaReader;
