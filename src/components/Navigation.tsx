import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopMangaDropdown } from "@/components/TopMangaDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const { user, logout, isAdmin } = useAuth();

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
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-manga-primary text-primary-foreground text-sm">
                {user?.profile?.nome?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button size="icon" variant="manga-ghost" onClick={logout}>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}