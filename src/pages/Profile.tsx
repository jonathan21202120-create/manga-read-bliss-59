import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { ClearHistoryDialog } from "@/components/ClearHistoryDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  User, 
  BookOpen, 
  Heart, 
  Star, 
  Calendar, 
  Trophy,
  Clock,
  TrendingUp,
  Trash2
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { progress, isLoading, fetchProgress } = useReadingProgress();
  const navigate = useNavigate();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  
  // Refresh progress when user comes back to profile
  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user, fetchProgress]);

  // Listen for custom refresh event from ClearHistoryDialog
  useEffect(() => {
    const handleRefreshProgress = () => {
      fetchProgress();
    };

    window.addEventListener('refreshProgress', handleRefreshProgress);
    return () => window.removeEventListener('refreshProgress', handleRefreshProgress);
  }, [fetchProgress]);
  
  const handleContinueReading = (mangaId: string, chapterId: string, page: number) => {
    navigate(`/manga/${mangaId}/chapter/${chapterId}?page=${page}`);
  };
  
  // Calculate stats from real reading progress
  const stats = {
    totalMangas: new Set(progress.map(p => p.mangaId)).size,
    totalChapters: progress.length,
    completedChapters: progress.filter(p => p.isCompleted).length,
    favoriteCount: 0, // TODO: Get from favorites table
    averageRating: 0, // TODO: Calculate from ratings
  };

  // Mock additional data that will come from Supabase later  
  const userData = {
    joinDate: "Janeiro 2024",
    readingStreak: 15,
    badges: [
      { name: "Leitor Iniciante", icon: "🌟", description: "Leu 10 mangás" },
      { name: "Maratonista", icon: "🏃", description: "Leu 100 capítulos em uma semana" },
      { name: "Crítico", icon: "⭐", description: "Avaliou 20 mangás" },
    ],
    readingGoals: {
      monthly: { current: stats.completedChapters, target: 10 },
      yearly: { current: stats.totalMangas, target: 100 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 space-y-8">
        {/* Cabeçalho do perfil */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-manga-primary">
                <AvatarImage src={user?.profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-manga-primary text-primary-foreground text-2xl font-bold">
                  {user?.profile?.nome?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-manga-text-primary mb-2">
                  {user?.profile?.nome || 'Usuário'}
                </h1>
                <p className="text-manga-text-secondary mb-4">{user?.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-manga-text-secondary">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Membro desde {userData.joinDate}
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {userData.readingStreak} dias de leitura consecutivos
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="manga-outline" onClick={() => setEditProfileOpen(true)}>
                  Editar Perfil
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setClearHistoryOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Histórico
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-manga-surface-elevated border-border/50">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-manga-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-manga-text-primary">{stats.totalMangas}</p>
              <p className="text-sm text-manga-text-secondary">Mangás Lidos</p>
            </CardContent>
          </Card>
          
          <Card className="bg-manga-surface-elevated border-border/50">
            <CardContent className="p-4 text-center">
              <Heart className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-manga-text-primary">{stats.favoriteCount}</p>
              <p className="text-sm text-manga-text-secondary">Favoritos</p>
            </CardContent>
          </Card>
          
          <Card className="bg-manga-surface-elevated border-border/50">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-manga-text-primary">{stats.averageRating.toFixed(1)}</p>
              <p className="text-sm text-manga-text-secondary">Avaliação Média</p>
            </CardContent>
          </Card>
          
          <Card className="bg-manga-surface-elevated border-border/50">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-manga-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-manga-text-primary">{stats.totalChapters}</p>
              <p className="text-sm text-manga-text-secondary">Capítulos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Metas de leitura */}
          <Card className="bg-manga-surface-elevated border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-manga-text-primary">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Metas de Leitura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-manga-text-secondary">Meta Mensal</span>
                  <span className="text-sm font-semibold text-manga-text-primary">
                    {userData.readingGoals.monthly.current}/{userData.readingGoals.monthly.target} mangás
                  </span>
                </div>
                <Progress 
                  value={(userData.readingGoals.monthly.current / userData.readingGoals.monthly.target) * 100} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-manga-text-secondary">Meta Anual</span>
                  <span className="text-sm font-semibold text-manga-text-primary">
                    {userData.readingGoals.yearly.current}/{userData.readingGoals.yearly.target} mangás
                  </span>
                </div>
                <Progress 
                  value={(userData.readingGoals.yearly.current / userData.readingGoals.yearly.target) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Conquistas */}
          <Card className="bg-manga-surface-elevated border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-manga-text-primary">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userData.badges.map((badge, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-manga-surface rounded-lg">
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <p className="font-semibold text-manga-text-primary">{badge.name}</p>
                      <p className="text-sm text-manga-text-secondary">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Leitura */}
        <Card className="bg-manga-surface-elevated border-border/50">
          <CardHeader>
            <CardTitle className="text-manga-text-primary">Histórico de Leitura</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-manga-text-secondary">
                Carregando histórico...
              </div>
            ) : progress.length > 0 ? (
              <div className="space-y-4">
                {progress.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-manga-surface rounded-lg hover:bg-manga-surface-elevated transition-colors">
                    <img 
                      src={item.mangaCoverUrl || "/placeholder.svg"} 
                      alt={item.mangaTitle}
                      className="w-16 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-manga-text-primary truncate">{item.mangaTitle}</h4>
                      <p className="text-sm text-manga-text-secondary">
                        Capítulo {item.chapterNumber}: {item.chapterTitle}
                      </p>
                      <p className="text-sm text-manga-text-secondary">
                        Página {item.currentPage} de {item.totalPages}
                      </p>
                      <p className="text-xs text-manga-text-secondary mt-1">
                        {new Date(item.lastReadAt).toLocaleDateString('pt-BR')} às {new Date(item.lastReadAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="mt-2">
                        <Progress value={item.progressPercentage} className="h-1.5" />
                        <p className="text-xs text-manga-text-secondary mt-1">{item.progressPercentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {item.isCompleted ? (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                          Completo
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="manga"
                          onClick={() => handleContinueReading(item.mangaId, item.chapterId, item.currentPage)}
                        >
                          Continuar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-manga-text-secondary">
                Nenhum histórico de leitura encontrado. Comece a ler um mangá!
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <ProfileEditForm 
        open={editProfileOpen} 
        onOpenChange={setEditProfileOpen} 
      />
      <ClearHistoryDialog 
        open={clearHistoryOpen} 
        onOpenChange={setClearHistoryOpen} 
      />
    </div>
  );
}