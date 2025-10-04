import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProtectedImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  priority?: boolean;
}

/**
 * ProtectedImage Component
 * 
 * Protege imagens contra download e captura através de:
 * - Desabilita clique direito
 * - Previne arrastar e copiar
 * - Adiciona camada invisível sobre a imagem
 * - Desabilita seleção de texto
 * - Adiciona marca d'água invisível via CSS
 */
export const ProtectedImage: React.FC<ProtectedImageProps> = ({
  src,
  alt,
  className,
  onLoad,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Previne captura via DevTools
    const preventInspect = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof MouseEvent && e.button === 2) {
        e.preventDefault();
        return false;
      }
      
      if (e instanceof KeyboardEvent) {
        // Desabilita F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+U
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'U')
        ) {
          e.preventDefault();
          return false;
        }
      }
    };

    const element = imgRef.current;
    if (element) {
      element.addEventListener('contextmenu', preventInspect as any);
      document.addEventListener('keydown', preventInspect as any);
    }

    return () => {
      if (element) {
        element.removeEventListener('contextmenu', preventInspect as any);
      }
      document.removeEventListener('keydown', preventInspect as any);
    };
  }, []);

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden select-none",
        className
      )}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      style={{
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {/* Camada de proteção invisível */}
      <div 
        className="absolute inset-0 z-10"
        style={{ 
          pointerEvents: 'all',
          cursor: 'default'
        }}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      />
      
      {/* Imagem com proteções */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-contain pointer-events-none",
          !isLoaded && "opacity-0"
        )}
        onLoad={handleImageLoad}
        onDragStart={handleDragStart}
        onContextMenu={handleContextMenu}
        loading={priority ? "eager" : "lazy"}
        draggable={false}
        style={{
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none',
          pointerEvents: 'none'
        }}
      />
      
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-manga-surface-elevated animate-pulse" />
      )}
      
      {/* Marca d'água invisível (detectável apenas via análise) */}
      <div 
        className="absolute bottom-0 right-0 text-[0.1px] opacity-0"
        style={{ pointerEvents: 'none' }}
        data-protected="true"
        data-source="culto-demonio-celestial"
      >
        {src}
      </div>
    </div>
  );
};
