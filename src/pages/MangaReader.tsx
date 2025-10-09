import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ReaderSettings, { ReaderSettingsType } from "@/components/ReaderSettings";
import { ProtectedImage } from "@/components/ProtectedImage";
import { useSecurityProtection } from "@/hooks/useSecurityProtection";
import {
  ArrowLeft,
  Home,
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
  const { updateProgress, getLastReadChapter } = useReadingProgress();
  const { user } = useAuth();
  const [manga, setManga] = useState<Manga | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout>();
  const [readerSettings, setReaderSettings] = useState<ReaderSettingsType>({
    readingMode: "webtoon",
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
    zoom: 100,
  });
  const hideControlsTimeout = useRef<NodeJS.Timeout>();

  // Apply security protections
  useSecurityProtection();

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
      }
    }
  }, [user, id, chapterId, currentChapter, getLastReadChapter]);

  // Save progress automatically when page changes
  useEffect(() => {
    if (user && id && chapterId && currentChapter && currentPage >= 0) {
      // Save progress automatically with a small delay to avoid too many calls
      const timeoutId = setTimeout(() => {
        const isLastPage = currentPage === currentChapter.pages.length - 1;
        updateProgress(id, chapterId, currentPage + 1, isLastPage);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [user, id, chapterId, currentChapter, currentPage, updateProgress]);

  // Triple-click system to show/hide controls
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignore clicks on buttons and interactive elements
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('select') || target.closest('[role="dialog"]')) {
        return;
      }

      // Clear existing timer
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }

      // Increment click count
      const newCount = clickCount + 1;
      setClickCount(newCount);

      // Check if we reached 3 clicks
      if (newCount >= 3) {
        setShowControls(!showControls);
        setClickCount(0);
        
        // Auto-hide after 5 seconds when showing
        if (!showControls) {
          hideControlsTimeout.current = setTimeout(() => {
            setShowControls(false);
          }, 5000);
        }
      } else {
        // Reset counter after 800ms of no clicks
        clickTimerRef.current = setTimeout(() => {
          setClickCount(0);
        }, 800);
      }
    };

    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [clickCount, showControls]);

  const getCurrentChapterIndex = () => {
    if (!manga || !currentChapter) return -1;
    return manga.chapters.findIndex(ch => ch.id === currentChapter.id);
  };

  const goToNextPage = () => {
    if (!currentChapter) return;
    
      if (readerSettings.readingMode === "webtoon") {
        // In webtoon mode, scroll down instead of changing pages
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
        return;
      }
      
      if (currentPage < currentChapter.pages.length - 1) {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
      } else {
      // Mark current chapter as completed
      if (user && id && chapterId) {
        updateProgress(id, chapterId, currentChapter.pages.length, true);
      }
      
      // Próximo capítulo
      const currentIndex = getCurrentChapterIndex();
      if (currentIndex < manga!.chapters.length - 1) {
        const nextChapter = manga!.chapters[currentIndex + 1];
        navigate(`/manga/${id}/chapter/${nextChapter.id}`);
      }
    }
  };

  const goToPrevPage = () => {
    if (readerSettings.readingMode === "webtoon") {
      // In webtoon mode, scroll up instead of changing pages
      window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
      return;
    }
    
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
    } else {
      // Capítulo anterior
      const currentIndex = getCurrentChapterIndex();
      if (currentIndex > 0) {
        const prevChapter = manga!.chapters[currentIndex - 1];
        navigate(`/manga/${id}/chapter/${prevChapter.id}`);
        setCurrentPage(prevChapter.pages.length - 1);
      }
    }
  };

  const goToChapter = (chapterId: string) => {
    navigate(`/manga/${id}/chapter/${chapterId}`);
    setCurrentPage(0);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
      case " ":
        e.preventDefault();
        goToNextPage();
        break;
      case "ArrowLeft":
        e.preventDefault();
        goToPrevPage();
        break;
      case "Escape":
        if (isFullscreen) {
          toggleFullscreen();
        }
        break;
      case "f":
      case "F":
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage, isFullscreen]);

  // Auto-scroll for webtoon mode and page tracking
  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    
    if (readerSettings.readingMode === "webtoon" && readerSettings.autoScroll) {
      const scrollSpeed = readerSettings.scrollSpeed * 1000;
      scrollInterval = setInterval(() => {
        const scrollAmount = window.innerHeight / (readerSettings.scrollSpeed * 10);
        window.scrollBy({ top: scrollAmount, behavior: 'auto' });
        
        // Check if we've reached the bottom
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const clientHeight = window.innerHeight;
        
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          clearInterval(scrollInterval);
          // Go to next chapter
          const currentIndex = getCurrentChapterIndex();
          if (manga && currentIndex < manga.chapters.length - 1) {
            const nextChapter = manga.chapters[currentIndex + 1];
            navigate(`/manga/${id}/chapter/${nextChapter.id}`);
          }
        }
      }, 100);
    }

    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [readerSettings.readingMode, readerSettings.autoScroll, readerSettings.scrollSpeed, manga, id, navigate]);

  // Calculate progress based on reading mode
  useEffect(() => {
    if (!currentChapter) return;

    if (readerSettings.readingMode === "webtoon") {
      // Calculate progress based on scroll position
      const handleScroll = () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollTop = window.scrollY;
        const scrollProgress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        setProgress(Math.min(100, Math.max(0, scrollProgress)));
      };

      handleScroll(); // Initial calculation
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      // Calculate progress based on current page
      const pageProgress = ((currentPage + 1) / currentChapter.pages.length) * 100;
      setProgress(pageProgress);
    }
  }, [readerSettings.readingMode, currentChapter, currentPage]);

  // Track current page in webtoon mode based on scroll position
  useEffect(() => {
    if (readerSettings.readingMode !== "webtoon" || !currentChapter) return;

    const handleScroll = () => {
      const images = document.querySelectorAll('img[alt^="Página"]');
      const viewportCenter = window.scrollY + window.innerHeight / 2;
      
      let currentVisiblePage = 0;
      images.forEach((img, index) => {
        const rect = img.getBoundingClientRect();
        const imageTop = window.scrollY + rect.top;
        const imageBottom = imageTop + rect.height;
        
        if (imageTop <= viewportCenter && imageBottom >= viewportCenter) {
          currentVisiblePage = index;
        }
      });

      if (currentVisiblePage !== currentPage) {
        setCurrentPage(currentVisiblePage);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [readerSettings.readingMode, currentChapter, currentPage]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (readerSettings.theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else if (readerSettings.theme === "dark") {
      root.classList.remove("light");
      root.classList.add("dark");
    } else {
      // Auto mode - use system preference
      root.classList.remove("light", "dark");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");
    }
  }, [readerSettings.theme]);

  if (isLoading || !manga || !currentChapter) {
    return (
      <div className="min-h-screen bg-manga-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-manga-text-primary mb-4">
            {isLoading ? "Carregando..." : "Capítulo não encontrado"}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-manga-surface relative overflow-hidden">
      {/* Navigation Controls */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-manga-surface/90 to-transparent p-4 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="manga-ghost"
              size="icon"
              onClick={() => navigate(`/manga/${id}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="manga-ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <Home className="h-5 w-5" />
            </Button>
            <div className="text-manga-text-primary font-semibold">
              {manga.title} - Capítulo {currentChapter.number}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Chapter Selector - Hidden on mobile */}
            <Select value={currentChapter.id} onValueChange={goToChapter}>
              <SelectTrigger className="hidden md:flex w-48 bg-manga-surface-elevated border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-manga-surface-elevated border-border/50">
                {manga.chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    Cap. {chapter.number}: {chapter.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Settings */}
            <ReaderSettings 
              settings={readerSettings}
              onSettingsChange={setReaderSettings}
            />

            {/* Fullscreen - Hidden on mobile */}
            <Button variant="manga-ghost" size="icon" onClick={toggleFullscreen} className="hidden md:flex">
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>

      </div>

      {/* Progress Bar - Always Visible */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-manga-surface/98 to-transparent backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between text-xs md:text-sm text-manga-text-secondary px-3 md:px-4 pt-2 md:pt-3 pb-1 md:pb-2">
          {readerSettings.showPageNumbers && (
            <span className="font-medium">Página {currentPage + 1} de {currentChapter.pages.length}</span>
          )}
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-manga-surface-elevated/40 h-1 md:h-1.5">
          <div
            className="bg-gradient-primary h-1 md:h-1.5 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Reader Area */}
      <div className={`min-h-screen ${readerSettings.readingMode === "webtoon" ? "pt-20 md:pt-32 pb-20 md:pb-8" : "flex items-center justify-center p-2 md:p-4 pt-20 md:pt-32 pb-20 md:pb-24"}`}>
        <div 
          className={`relative ${readerSettings.readingMode === "webtoon" ? "w-full flex justify-center" : "max-w-full max-h-full"}`}
          style={{ 
            transform: readerSettings.readingMode === "webtoon" ? `scale(${readerSettings.zoom / 100})` : `scale(${readerSettings.zoom / 100})`,
            filter: `brightness(${readerSettings.brightness}%) contrast(${readerSettings.contrast}%) ${readerSettings.invertColors ? 'invert(1)' : ''} ${readerSettings.grayscale ? 'grayscale(1)' : ''}`,
            transformOrigin: 'center center',
            transition: `filter ${readerSettings.transitionSpeed}ms ease, transform ${readerSettings.transitionSpeed}ms ease`
          }}
        >
          {readerSettings.readingMode === "single" ? (
            <ProtectedImage
              src={currentChapter.pages[currentPage]}
              alt={`Página ${currentPage + 1}`}
              className={`max-w-full max-h-[calc(100vh-200px)] rounded-lg shadow-elevated transition-all duration-${readerSettings.transitionSpeed} ${
                readerSettings.pagefit === "width" ? "w-full" :
                readerSettings.pagefit === "height" ? "h-full" :
                readerSettings.pagefit === "screen" ? "w-screen h-screen" : ""
              }`}
              priority={true}
            />
          ) : readerSettings.readingMode === "double" ? (
            <div className={`flex gap-2 ${readerSettings.readingDirection === "rtl" ? "flex-row-reverse" : ""}`}>
              <ProtectedImage
                src={currentChapter.pages[currentPage]}
                alt={`Página ${currentPage + 1}`}
                className={`max-w-[50vw] max-h-[calc(100vh-200px)] rounded-lg shadow-elevated transition-all duration-${readerSettings.transitionSpeed}`}
                priority={true}
              />
              {currentPage + 1 < currentChapter.pages.length && (
                <ProtectedImage
                  src={currentChapter.pages[currentPage + 1]}
                  alt={`Página ${currentPage + 2}`}
                  className={`max-w-[50vw] max-h-[calc(100vh-200px)] rounded-lg shadow-elevated transition-all duration-${readerSettings.transitionSpeed}`}
                />
              )}
            </div>
          ) : (
            /* Webtoon Mode - Vertical Scroll */
            <div className="flex flex-col items-center gap-0 max-w-3xl mx-auto px-0 md:px-4">
              {currentChapter.pages.map((page, index) => (
                <ProtectedImage
                  key={index}
                  src={page}
                  alt={`Página ${index + 1}`}
                  className={`w-full shadow-none md:shadow-lg transition-all duration-${readerSettings.transitionSpeed} ${
                    readerSettings.pagefit === "width" ? "max-w-full" :
                    readerSettings.pagefit === "original" ? "max-w-none" : "max-w-full"
                  }`}
                  priority={index < 3}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Arrows - Hidden in webtoon mode */}
      {readerSettings.readingMode !== "webtoon" && (
        <>
          <Button
            variant="manga-ghost"
            size="icon"
            className={`fixed left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-manga-surface/80 backdrop-blur-sm transition-opacity duration-300 h-12 w-12 md:h-10 md:w-10 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
            onClick={goToPrevPage}
            disabled={currentPage === 0 && getCurrentChapterIndex() === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="manga-ghost"  
            size="icon"
            className={`fixed right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-manga-surface/80 backdrop-blur-sm transition-opacity duration-300 h-12 w-12 md:h-10 md:w-10 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
            onClick={goToNextPage}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Bottom Controls - Fixed Navigation Buttons */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-manga-surface/98 to-transparent backdrop-blur-md p-3 md:p-4 transition-transform duration-300 ${
        showControls ? "translate-y-0" : "translate-y-full"
      }`}>
        <div className="flex items-center justify-center gap-2 md:gap-3">
          <Button
            variant="manga-outline"
            size="lg"
            className="flex-1 max-w-[180px] h-12 md:h-11 text-sm md:text-base gap-2"
            onClick={() => {
              const currentIndex = getCurrentChapterIndex();
              if (currentIndex > 0) {
                const prevChapter = manga!.chapters[currentIndex - 1];
                navigate(`/manga/${id}/chapter/${prevChapter.id}`);
                setCurrentPage(0);
              }
            }}
            disabled={getCurrentChapterIndex() === 0}
          >
            <ChevronLeft className="h-5 w-5" />
            Capítulo Anterior
          </Button>
          
          <Button
            variant="manga"
            size="lg"
            className="flex-1 max-w-[180px] h-12 md:h-11 text-sm md:text-base gap-2"
            onClick={() => {
              const currentIndex = getCurrentChapterIndex();
              if (currentIndex < manga!.chapters.length - 1) {
                const nextChapter = manga!.chapters[currentIndex + 1];
                navigate(`/manga/${id}/chapter/${nextChapter.id}`);
                setCurrentPage(0);
              }
            }}
            disabled={getCurrentChapterIndex() === manga!.chapters.length - 1}
          >
            Próximo Capítulo
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Click Areas for Navigation - Hidden in webtoon mode */}
      {readerSettings.readingMode !== "webtoon" && (
        <>
          <div 
            className="fixed left-0 top-0 w-1/3 h-full z-10 cursor-pointer"
            onClick={goToPrevPage}
          />
          <div 
            className="fixed right-0 top-0 w-1/3 h-full z-10 cursor-pointer"
            onClick={goToNextPage}
          />
        </>
      )}
    </div>
  );
};

export default MangaReader;