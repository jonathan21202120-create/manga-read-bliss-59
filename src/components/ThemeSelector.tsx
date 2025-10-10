import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeOption {
  name: ThemeName;
  label: string;
  colors: string[]; // Gradient colors for the preview circle
}

const themes: ThemeOption[] = [
  {
    name: 'manga',
    label: 'Roxo Manga',
    colors: ['#a78bfa', '#67e8f9'],
  },
  {
    name: 'ocean',
    label: 'Azul Oceano',
    colors: ['#3b82f6', '#06b6d4'],
  },
  {
    name: 'fire',
    label: 'Vermelho Fogo',
    colors: ['#ef4444', '#f97316'],
  },
  {
    name: 'nature',
    label: 'Verde Natureza',
    colors: ['#10b981', '#22c55e'],
  },
  {
    name: 'gold',
    label: 'Dourado',
    colors: ['#f59e0b', '#eab308'],
  },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="manga-ghost" size="icon" className="relative">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Selecionar tema de cores</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Tema de Cores</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="grid gap-1">
          {themes.map((themeOption) => (
            <DropdownMenuItem
              key={themeOption.name}
              onClick={() => setTheme(themeOption.name)}
              className={cn(
                'flex items-center gap-3 cursor-pointer',
                theme === themeOption.name && 'bg-accent'
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full transition-all",
                  theme === themeOption.name ? "ring-2 ring-offset-2 ring-offset-background" : ""
                )}
                style={{
                  background: `linear-gradient(135deg, ${themeOption.colors[0]}, ${themeOption.colors[1]})`,
                }}
              />
              <span className="flex-1">{themeOption.label}</span>
              {theme === themeOption.name && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
