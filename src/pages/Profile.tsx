import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  BookOpen, 
  Heart, 
  Star, 
  Calendar, 
  Trophy,
  Clock,
  TrendingUp
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleContinueReading = (mangaId: number, chapterId: number, page: number) => {
    navigate(`/manga/${mangaId}/chapter/${chapterId}?page=${page}`);
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
    readingHistory: [
      { 
        mangaId: 1,
        mangaTitle: "Guerra dos Guerreiros", 
        coverImage: "/src/assets/manga-cover-1.jpg",
        currentChapter: 45, 
        totalChapters: 120,
        currentPage: 12,
        lastRead: "2 horas atrás",
        progress: 37.5
      },
      { 
        mangaId: 2,
        mangaTitle: "Guardiã Mística", 
        coverImage: "/src/assets/manga-cover-2.jpg",
        currentChapter: 23, 
        totalChapters: 50,
        currentPage: 8,
        lastRead: "1 dia atrás",
        progress: 46
      },
      { 
        mangaId: 3,
        mangaTitle: "Cyber Ninja", 
        coverImage: "/src/assets/manga-cover-3.jpg",
        currentChapter: 89, 
        totalChapters: 89,
        currentPage: 15,
        lastRead: "3 dias atrás",
        progress: 100
      },
    ],
    readingGoals: {
      monthly: { current: 8, target: 10 },
      yearly: { current: 45, target: 100 }
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
                <AvatarImage src="/placeholder.svg" />
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
              
              <Button variant="manga-outline">
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-manga-surface-elevated border-border/50">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-manga-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-manga-text-primary">0</p>
              <p className="text-sm text-manga-text-secondary">Mangás Lidos</p>
            </CardContent>
          </Card>
          
          <Card className="bg-manga-surface-elevated border-border/50">
            <CardContent className="p-4 text-center">
              <Heart className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-manga-text-primary">0</p>
              <p className="text-sm text-manga-text-secondary">Favoritos</p>
            </CardContent>
          </Card>
          
          <Card className="bg-manga-surface-elevated border-border/50">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-manga-text-primary">0</p>
              <p className="text-sm text-manga-text-secondary">Avaliação Média</p>
            </CardContent>
          </Card>
          
          <Card className="bg-manga-surface-elevated border-border/50">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-manga-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-manga-text-primary">0</p>
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
            <div className="space-y-4">
              {userData.readingHistory.map((history, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-manga-surface rounded-lg hover:bg-manga-surface-elevated transition-colors">
                  <img 
                    src={history.coverImage} 
                    alt={history.mangaTitle}
                    className="w-16 h-20 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-manga-text-primary truncate">{history.mangaTitle}</h4>
                    <p className="text-sm text-manga-text-secondary">
                      Capítulo {history.currentChapter}/{history.totalChapters} • Página {history.currentPage}
                    </p>
                    <p className="text-xs text-manga-text-secondary mt-1">{history.lastRead}</p>
                    <div className="mt-2">
                      <Progress value={history.progress} className="h-1.5" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {history.progress < 100 ? (
                      <Button 
                        size="sm" 
                        variant="manga"
                        onClick={() => handleContinueReading(history.mangaId, history.currentChapter, history.currentPage)}
                      >
                        Continuar
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                        Completo
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}