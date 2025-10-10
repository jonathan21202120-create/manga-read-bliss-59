import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName = 'manga' | 'ocean' | 'fire' | 'nature' | 'gold';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // Carregar tema do localStorage ou usar padrão
    const savedTheme = localStorage.getItem('color-theme') as ThemeName;
    return savedTheme || 'manga';
  });

  useEffect(() => {
    // Aplicar o tema no elemento HTML
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Salvar no localStorage
    localStorage.setItem('color-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
