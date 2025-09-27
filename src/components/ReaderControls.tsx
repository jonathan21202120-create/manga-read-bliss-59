import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize, 
  Sun, 
  Moon, 
  Settings,
  ArrowLeft,
  ArrowRight,
  Home
} from "lucide-react";

interface ReaderControlsProps {
  currentPage: number;
  totalPages: number;
  currentChapter: number;
  totalChapters: number;
  zoom: number;
  readingMode: "single" | "double" | "webtoon";
  isDarkMode: boolean;
  isFullscreen: boolean;
  fitMode: "width" | "height" | "original";
  onPageChange: (page: number) => void;
  onChapterChange: (direction: "prev" | "next") => void;
  onZoomChange: (zoom: number) => void;
  onReadingModeChange: (mode: "single" | "double" | "webtoon") => void;
  onDarkModeToggle: () => void;
  onFullscreenToggle: () => void;
  onFitModeChange: (mode: "width" | "height" | "original") => void;
  onGoHome: () => void;
}

export function ReaderControls({
  currentPage,
  totalPages,
  currentChapter,
  totalChapters,
  zoom,
  readingMode,
  isDarkMode,
  isFullscreen,
  fitMode,
  onPageChange,
  onChapterChange,
  onZoomChange,
  onReadingModeChange,
  onDarkModeToggle,
  onFullscreenToggle,
  onFitModeChange,
  onGoHome
}: ReaderControlsProps) {
  const [pageInput, setPageInput] = useState(currentPage.toString());
  const [showSettings, setShowSettings] = useState(false);

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    }
  };

  return (
    <>
      {/* Top Controls */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left - Navigation */}
          <div className="flex items-center gap-4">
            <Button
              variant="manga-ghost"
              size="icon"
              onClick={onGoHome}
              title="Voltar ao início"
            >
              <Home className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="manga-outline"
                size="sm"
                onClick={() => onChapterChange("prev")}
                disabled={currentChapter <= 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Cap. Anterior
              </Button>

              <Badge className="bg-manga-primary/20 text-manga-primary border-manga-primary/30">
                Capítulo {currentChapter} de {totalChapters}
              </Badge>

              <Button
                variant="manga-outline"
                size="sm"
                onClick={() => onChapterChange("next")}
                disabled={currentChapter >= totalChapters}
                className="flex items-center gap-2"
              >
                Cap. Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Center - Page Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-manga-text-secondary">Página:</span>
              <Input
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageInputSubmit}
                onKeyPress={handlePageInputKeyPress}
                className="w-16 h-8 text-center text-sm bg-manga-surface-elevated border-border/50"
              />
              <span className="text-sm text-manga-text-secondary">de {totalPages}</span>
            </div>

            <div className="w-32">
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Right - Settings */}
          <div className="flex items-center gap-2">
            <Button
              variant="manga-ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              title="Configurações"
            >
              <Settings className="h-5 w-5" />
            </Button>

            <Button
              variant="manga-ghost"
              size="icon"
              onClick={onDarkModeToggle}
              title="Alternar tema"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button
              variant="manga-ghost"
              size="icon"
              onClick={onFullscreenToggle}
              title="Tela cheia"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-manga-surface-elevated rounded-lg border border-border/50">
            <div className="flex flex-wrap gap-6">
              {/* Reading Mode */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-manga-text-secondary whitespace-nowrap">Modo de leitura:</span>
                <Select value={readingMode} onValueChange={onReadingModeChange}>
                  <SelectTrigger className="w-32 bg-manga-surface border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Página única</SelectItem>
                    <SelectItem value="double">Página dupla</SelectItem>
                    <SelectItem value="webtoon">Webtoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fit Mode */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-manga-text-secondary whitespace-nowrap">Ajuste:</span>
                <Select value={fitMode} onValueChange={onFitModeChange}>
                  <SelectTrigger className="w-32 bg-manga-surface border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="width">Ajustar largura</SelectItem>
                    <SelectItem value="height">Ajustar altura</SelectItem>
                    <SelectItem value="original">Tamanho original</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-manga-text-secondary">Zoom:</span>
                <Button
                  variant="manga-ghost"
                  size="sm"
                  onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-manga-text-primary min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="manga-ghost"
                  size="sm"
                  onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="manga-ghost"
                  size="sm"
                  onClick={() => onZoomChange(1)}
                  title="Resetar zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation (Floating) */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-background/95 backdrop-blur-sm border border-border/50 rounded-full px-4 py-2 shadow-lg">
        <Button
          variant="manga-ghost"
          size="icon"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          title="Página anterior"
          className="rounded-full"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Badge variant="secondary" className="bg-manga-primary/20 text-manga-primary border-manga-primary/30 px-3">
          {currentPage} / {totalPages}
        </Badge>

        <Button
          variant="manga-ghost"
          size="icon"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          title="Próxima página"
          className="rounded-full"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </>
  );
}