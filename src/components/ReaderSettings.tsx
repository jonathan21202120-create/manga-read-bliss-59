import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Settings, Monitor, Moon, Sun, Smartphone, Tablet, BookOpen } from "lucide-react";

export interface ReaderSettingsType {
  readingMode: "single" | "double" | "webtoon";
  readingDirection: "ltr" | "rtl";
  pagefit: "width" | "height" | "original" | "screen";
  theme: "light" | "dark" | "auto";
  autoScroll: boolean;
  scrollSpeed: number;
  imageQuality: "low" | "medium" | "high";
  transitionSpeed: number;
  showPageNumbers: boolean;
  invertColors: boolean;
  grayscale: boolean;
  brightness: number;
  contrast: number;
}

interface ReaderSettingsProps {
  settings: ReaderSettingsType;
  onSettingsChange: (settings: ReaderSettingsType) => void;
}

const ReaderSettings = ({ settings, onSettingsChange }: ReaderSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateSetting = <K extends keyof ReaderSettingsType>(
    key: K,
    value: ReaderSettingsType[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="manga-ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-manga-surface-elevated border-border/50" align="end">
        <div className="space-y-4">
          <div className="text-lg font-semibold text-manga-text-primary">
            Configurações de Leitura
          </div>

          {/* Modo de Leitura */}
          <div className="space-y-2">
            <Label className="text-manga-text-primary font-medium">Modo de Leitura</Label>
            <Select value={settings.readingMode} onValueChange={(value: any) => updateSetting("readingMode", value)}>
              <SelectTrigger className="bg-manga-surface border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-manga-surface-elevated border-border/50">
                <SelectItem value="single">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Página Única
                  </div>
                </SelectItem>
                <SelectItem value="double">
                  <div className="flex items-center gap-2">
                    <Tablet className="h-4 w-4" />
                    Página Dupla
                  </div>
                </SelectItem>
                <SelectItem value="webtoon">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Webtoon (Vertical)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Direção de Leitura */}
          <div className="space-y-2">
            <Label className="text-manga-text-primary font-medium">Direção de Leitura</Label>
            <Select value={settings.readingDirection} onValueChange={(value: any) => updateSetting("readingDirection", value)}>
              <SelectTrigger className="bg-manga-surface border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-manga-surface-elevated border-border/50">
                <SelectItem value="ltr">Esquerda para Direita</SelectItem>
                <SelectItem value="rtl">Direita para Esquerda (Mangá)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ajuste de Página */}
          <div className="space-y-2">
            <Label className="text-manga-text-primary font-medium">Ajuste de Página</Label>
            <Select value={settings.pagefit} onValueChange={(value: any) => updateSetting("pagefit", value)}>
              <SelectTrigger className="bg-manga-surface border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-manga-surface-elevated border-border/50">
                <SelectItem value="width">Ajustar à Largura</SelectItem>
                <SelectItem value="height">Ajustar à Altura</SelectItem>
                <SelectItem value="screen">Tela Inteira</SelectItem>
                <SelectItem value="original">Tamanho Original</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-border/50" />

          {/* Tema */}
          <div className="space-y-2">
            <Label className="text-manga-text-primary font-medium">Tema</Label>
            <Select value={settings.theme} onValueChange={(value: any) => updateSetting("theme", value)}>
              <SelectTrigger className="bg-manga-surface border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-manga-surface-elevated border-border/50">
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Claro
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Escuro
                  </div>
                </SelectItem>
                <SelectItem value="auto">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Automático
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Qualidade da Imagem */}
          <div className="space-y-2">
            <Label className="text-manga-text-primary font-medium">Qualidade da Imagem</Label>
            <Select value={settings.imageQuality} onValueChange={(value: any) => updateSetting("imageQuality", value)}>
              <SelectTrigger className="bg-manga-surface border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-manga-surface-elevated border-border/50">
                <SelectItem value="low">Baixa (Mais Rápido)</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta (Melhor Qualidade)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-border/50" />

          {/* Configurações de Rolagem */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-manga-text-primary font-medium">Auto Scroll</Label>
              <Switch
                checked={settings.autoScroll}
                onCheckedChange={(checked) => updateSetting("autoScroll", checked)}
              />
            </div>

            {settings.autoScroll && (
              <div className="space-y-2">
                <Label className="text-manga-text-secondary text-sm">
                  Velocidade: {settings.scrollSpeed}s
                </Label>
                <Slider
                  value={[settings.scrollSpeed]}
                  onValueChange={(value) => updateSetting("scrollSpeed", value[0])}
                  min={1}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Velocidade de Transição */}
          <div className="space-y-2">
            <Label className="text-manga-text-primary font-medium">
              Velocidade de Transição: {settings.transitionSpeed}ms
            </Label>
            <Slider
              value={[settings.transitionSpeed]}
              onValueChange={(value) => updateSetting("transitionSpeed", value[0])}
              min={100}
              max={1000}
              step={50}
              className="w-full"
            />
          </div>

          <Separator className="bg-border/50" />

          {/* Configurações Visuais */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-manga-text-primary font-medium">Mostrar Números de Página</Label>
              <Switch
                checked={settings.showPageNumbers}
                onCheckedChange={(checked) => updateSetting("showPageNumbers", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-manga-text-primary font-medium">Inverter Cores</Label>
              <Switch
                checked={settings.invertColors}
                onCheckedChange={(checked) => updateSetting("invertColors", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-manga-text-primary font-medium">Escala de Cinza</Label>
              <Switch
                checked={settings.grayscale}
                onCheckedChange={(checked) => updateSetting("grayscale", checked)}
              />
            </div>
          </div>

          {/* Brilho */}
          <div className="space-y-2">
            <Label className="text-manga-text-primary font-medium">
              Brilho: {settings.brightness}%
            </Label>
            <Slider
              value={[settings.brightness]}
              onValueChange={(value) => updateSetting("brightness", value[0])}
              min={50}
              max={150}
              step={5}
              className="w-full"
            />
          </div>

          {/* Contraste */}
          <div className="space-y-2">
            <Label className="text-manga-text-primary font-medium">
              Contraste: {settings.contrast}%
            </Label>
            <Slider
              value={[settings.contrast]}
              onValueChange={(value) => updateSetting("contrast", value[0])}
              min={50}
              max={200}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReaderSettings;