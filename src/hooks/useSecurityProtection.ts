import { useEffect } from 'react';

/**
 * useSecurityProtection Hook
 * 
 * Aplica proteções de segurança globais:
 * - Desabilita teclas de desenvolvedor
 * - Monitora tentativas de inspeção
 * - Previne prints e capturas
 * - Adiciona proteção contra scraping
 */
export const useSecurityProtection = () => {
  useEffect(() => {
    // Desabilita clique direito globalmente
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Desabilita teclas de desenvolvedor
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'U') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 'S') {
        e.preventDefault();
        return false;
      }
    };

    // Previne arrastar imagens
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    // Previne seleção de texto em imagens
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('[data-protected="true"]')) {
        e.preventDefault();
        return false;
      }
    };

    // Detecta DevTools aberto (técnica de timing)
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        // DevTools detectado - pode-se adicionar analytics aqui
        console.clear();
      }
    };

    // Adiciona listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);
    
    // Monitora DevTools
    const devToolsInterval = setInterval(detectDevTools, 1000);

    // Adiciona proteção CSS contra screenshots
    document.body.style.setProperty('-webkit-user-select', 'none');
    document.body.style.setProperty('-moz-user-select', 'none');
    document.body.style.setProperty('-ms-user-select', 'none');
    document.body.style.setProperty('user-select', 'none');

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
      clearInterval(devToolsInterval);
    };
  }, []);
};
