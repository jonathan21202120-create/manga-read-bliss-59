import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopMangaDropdown } from "@/components/TopMangaDropdown";
import { AgeGateModal } from "@/components/AgeGateModal";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  Home, 
  BookOpen, 
  Heart, 
  User, 
  Menu,
  X,
  Shield,
  LogOut
} from "lucide-react";

interface NavigationProps {
  topMangas?: any[];
  onRead?: (id: string) => void;
}

export function Navigation({ topMangas = [], onRead }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdultModalOpen, setIsAdultModalOpen] = useState(false);
  const [isAdultContentEnabled, setIsAdultContentEnabled] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado com sucesso!",
        description: "Até a próxima!",
      });
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleAdultContentConfirm = () => {
    setIsAdultContentEnabled(true);
    toast({
      title: "Conteúdo +18 ativado",
      description: "Válido apenas para esta sessão",
    });
  };

  const baseNavItems = [
    { icon: Home, label: "Início", href: "/" },
    { icon: BookOpen, label: "Biblioteca", href: "/library" },
    { icon: Heart, label: "Favoritos", href: "/favorites" },
    { icon: User, label: "Perfil", href: "/profile" },
  ];

  const navItems = isAdmin() 
    ? [...baseNavItems, { icon: Shield, label: "Admin", href: "/admin" }]
    : baseNavItems;

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between p-6 bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-manga-text-primary">Culto do Demônio Celestial</span>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link key={item.label} to={item.href}>
                <Button
                  variant="manga-ghost"
                  className="flex items-center gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            
            {/* Adult Content Button */}
            <Button
              variant={isAdultContentEnabled ? "manga" : "manga-ghost"}
              className="flex items-center gap-2"
              onClick={() => setIsAdultModalOpen(true)}
            >
              <Shield className="h-4 w-4" />
              +18
            </Button>
          </div>
        </div>
        
        {/* Search and Actions */}
        <div className="flex items-center gap-4">
          {/* Top Manga Dropdown */}
          {topMangas.length > 0 && (
            <TopMangaDropdown topMangas={topMangas} onRead={onRead} />
          )}
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-manga-text-muted" />
            <Input
              placeholder="Buscar mangás..."
              className="pl-10 w-64 bg-manga-surface-elevated border-border/50 focus:border-manga-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Link to="/profile">
              <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-manga-primary transition-all">
                <AvatarImage src={user?.profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-manga-primary text-primary-foreground text-sm">
                  {user?.profile?.nome?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button size="icon" variant="manga-ghost" onClick={handleLogout} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Navigation */}
      <nav className="md:hidden flex items-center justify-between p-4 bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-manga-text-primary">Culto do Demônio Celestial</span>
        </div>
        
        <Button
          size="icon"
          variant="manga-ghost"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] bg-background/95 backdrop-blur-sm z-40">
          <div className="p-4 space-y-4">
            {/* Top Manga Dropdown Mobile */}
            {topMangas.length > 0 && (
              <div className="w-full">
                <TopMangaDropdown topMangas={topMangas} onRead={onRead} />
              </div>
            )}
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-manga-text-muted" />
              <Input
                placeholder="Buscar mangás..."
                className="pl-10 bg-manga-surface-elevated border-border/50 focus:border-manga-primary"
              />
            </div>
            
            {/* Navigation Items */}
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link key={item.label} to={item.href}>
                  <Button
                    variant="manga-ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              
              {/* Adult Content Button for Mobile */}
              <Button
                variant={isAdultContentEnabled ? "manga" : "manga-ghost"}
                className="w-full justify-start gap-3 h-12"
                onClick={() => {
                  setIsAdultModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                <Shield className="h-5 w-5" />
                +18
              </Button>
              
              {/* Logout Button for Mobile */}
              <Button
                variant="manga-ghost"
                className="w-full justify-start gap-3 h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOut className="h-5 w-5" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Age Gate Modal */}
      <AgeGateModal
        isOpen={isAdultModalOpen}
        onOpenChange={setIsAdultModalOpen}
        onConfirm={handleAdultContentConfirm}
      />
    </>
  );
}