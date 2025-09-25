import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Star, 
  BookOpen, 
  Play, 
  Bookmark, 
  Heart, 
  Users, 
  Calendar,
  MessageCircle,
  Send
} from "lucide-react";
import { CommentItem } from "@/components/CommentItem";
import { Checkbox as CheckboxUI } from "@/components/ui/checkbox";

interface Chapter {
  id: string;
  number: number;
  title: string;
  releaseDate: string;
  pages: number;
  isRead?: boolean;
}

interface Comment {
  id: string;
  user: string;
  userAvatar?: string;
  content: string;
  date: string;
  likes: number;
  isSpoiler?: boolean;
}

interface Manga {
  id: string;
  title: string;
  cover: string;
  rating: number;
  status: "ongoing" | "completed" | "hiatus";
  genre: string[];
  description: string;
  author: string;
  artist: string;
  year: number;
  chapters: Chapter[];
  totalReads: number;
  followers: number;
}

const MangaDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [manga, setManga] = useState<Manga | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [lastReadChapter, setLastReadChapter] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpoilerComment, setIsSpoilerComment] = useState(false);

  // Fetch manga data from Supabase
  useEffect(() => {
    const fetchMangaData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch manga
        const { data: mangaData, error: mangaError } = await supabase
          .from('mangas')
          .select('*')
          .eq('id', id)
          .single();
        
        if (mangaError) throw mangaError;
        
        // Fetch chapters
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('manga_id', id)
          .order('chapter_number', { ascending: true });
        
        if (chaptersError) throw chaptersError;
        
        // Transform data to match expected format
        const transformedManga: Manga = {
          id: mangaData.id,
          title: mangaData.title,
          cover: mangaData.cover_url,
          rating: mangaData.rating,
          status: mangaData.status as "ongoing" | "completed" | "hiatus",
          genre: mangaData.genre,
          description: mangaData.description,
          author: mangaData.author,
          artist: mangaData.artist || mangaData.author,
          year: mangaData.year,
          totalReads: mangaData.total_reads,
          followers: mangaData.followers,
          chapters: chaptersData?.map(chapter => ({
            id: chapter.id,
            number: chapter.chapter_number,
            title: chapter.title,
            releaseDate: chapter.release_date,
            pages: chapter.page_count,
            isRead: false // Will be determined by reading progress
          })) || []
        };
        
        setManga(transformedManga);
        
        // Check if user has favorited this manga
        if (user) {
          const { data: favoriteData } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('manga_id', id)
            .single();
          
          setIsFavorite(!!favoriteData);
          
          // Get reading progress
          const { data: progressData } = await supabase
            .from('reading_progress')
            .select('*, chapters(*)')
            .eq('user_id', user.id)
            .eq('manga_id', id)
            .single();
          
          if (progressData) {
            setLastReadChapter(progressData.chapters.chapter_number);
          }
        }
        
        // Fetch comments
        const { data: commentsData } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            likes,
            created_at,
            user_id
          `)
          .eq('manga_id', id)
          .order('created_at', { ascending: false });
          
        // Fetch profiles separately and join manually
        let transformedComments: Comment[] = [];
        if (commentsData && commentsData.length > 0) {
          const userIds = commentsData.map(comment => comment.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, nome, avatar_url')
            .in('user_id', userIds);
            
          transformedComments = commentsData.map((comment: any) => {
            const profile = profilesData?.find(p => p.user_id === comment.user_id);
            return {
              id: comment.id,
              user: profile?.nome || 'Usuário',
              userAvatar: profile?.avatar_url,
              content: comment.content,
              date: new Date(comment.created_at).toLocaleDateString(),
              likes: comment.likes,
              isSpoiler: comment.content.toLowerCase().includes('spoiler') || comment.content.includes('🔍')
            };
          });
        }
        
        if (commentsData) {
          const transformedComments: Comment[] = commentsData.map((comment: any) => ({
            id: comment.id,
            user: comment.profiles?.nome || 'Usuário',
            userAvatar: comment.profiles?.avatar_url,
            content: comment.content,
            date: new Date(comment.created_at).toLocaleDateString(),
            likes: comment.likes,
            isSpoiler: comment.content.toLowerCase().includes('spoiler') || comment.content.includes('🔍')
          }));
          setComments(transformedComments);
        }
        
      } catch (error) {
        console.error('Error fetching manga data:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do mangá.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMangaData();
  }, [id, user]);

  const handleStartReading = () => {
    if (manga && manga.chapters.length > 0) {
      navigate(`/manga/${manga.id}/chapter/${manga.chapters[0].id}`);
    }
  };

  const handleContinueReading = () => {
    if (manga && lastReadChapter) {
      const nextChapter = manga.chapters.find(ch => ch.number === lastReadChapter + 1);
      if (nextChapter) {
        navigate(`/manga/${manga.id}/chapter/${nextChapter.id}`);
      }
    }
  };

  const handleChapterClick = (chapterId: string) => {
    navigate(`/manga/${manga.id}/chapter/${chapterId}`);
  };

  const toggleFavorite = async () => {
    if (!user || !manga) return;
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('manga_id', manga.id);
        
        if (error) throw error;
        setIsFavorite(false);
        toast({
          title: "Removido dos favoritos",
          description: manga.title,
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            manga_id: manga.id
          });
        
        if (error) throw error;
        setIsFavorite(true);
        toast({
          title: "Adicionado aos favoritos!",
          description: manga.title,
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos.",
        variant: "destructive"
      });
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !user || !manga) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          manga_id: manga.id,
          content: newComment.trim()
        })
        .select('id, content, created_at, user_id')
        .single();
      
      if (error) throw error;
      
      // Get user profile for the new comment
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome, avatar_url')
        .eq('user_id', user.id)
        .single();
      
      const newCommentObj: Comment = {
        id: data.id,
        user: profileData?.nome || user.profile?.nome || 'Usuário',
        userAvatar: profileData?.avatar_url || user.profile?.avatar_url,
        content: data.content,
        date: new Date(data.created_at).toLocaleDateString(),
        likes: 0,
        isSpoiler: isSpoilerComment
      };
      
      setComments([newCommentObj, ...comments]);
      setNewComment("");
      setIsSpoilerComment(false);
      toast({
        title: "Comentário enviado!",
        description: "Seu comentário foi adicionado com sucesso.",
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o comentário.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <Navigation topMangas={[]} onRead={() => {}} />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-manga-text-primary">Carregando...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <Navigation topMangas={[]} onRead={() => {}} />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-manga-text-primary">Mangá não encontrado</h1>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    ongoing: "bg-green-500/20 text-green-400 border-green-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    hiatus: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Navigation topMangas={[]} onRead={() => {}} />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cover Image */}
          <div className="lg:col-span-1">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-elevated">
              <img
                src={manga.cover}
                alt={manga.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Manga Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-manga-text-primary">
                  {manga.title}
                </h1>
                <Button
                  variant="manga-ghost"
                  size="icon"
                  onClick={toggleFavorite}
                  className={isFavorite ? "text-red-400" : "text-manga-text-muted"}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="font-semibold text-manga-text-primary">{manga.rating}</span>
                </div>
                <Badge className={`border ${statusColors[manga.status]}`}>
                  {manga.status === "ongoing" ? "Em andamento" : 
                   manga.status === "completed" ? "Completo" : "Pausado"}
                </Badge>
                <div className="flex items-center gap-1 text-manga-text-secondary">
                  <Calendar className="h-4 w-4" />
                  <span>{manga.year}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {manga.genre.map((g, index) => (
                  <Badge key={index} variant="secondary" className="bg-manga-surface-elevated text-manga-text-secondary">
                    {g}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-manga-text-secondary mb-6">
                <div><span className="font-medium">Autor:</span> {manga.author}</div>
                <div><span className="font-medium">Artista:</span> {manga.artist}</div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{manga.totalReads.toLocaleString()} leituras</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{manga.followers.toLocaleString()} seguidores</span>
                </div>
              </div>

              <p className="text-manga-text-secondary leading-relaxed mb-6">
                {manga.description}
              </p>

              <div className="flex gap-3">
                {lastReadChapter ? (
                  <Button onClick={handleContinueReading} className="bg-manga-primary hover:bg-manga-primary/90">
                    <Play className="h-4 w-4 mr-2" />
                    Continuar Lendo
                  </Button>
                ) : (
                  <Button onClick={handleStartReading} className="bg-manga-primary hover:bg-manga-primary/90">
                    <Play className="h-4 w-4 mr-2" />
                    Começar a Ler
                  </Button>
                )}
                <Button variant="manga-outline">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Adicionar à Lista
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="border-border/50" />

        {/* Chapters Section */}
        <section>
          <h2 className="text-2xl font-bold text-manga-text-primary mb-6">
            Capítulos ({manga.chapters.length})
          </h2>
          <div className="grid gap-3">
            {manga.chapters.map((chapter) => (
              <Card key={chapter.id} className="bg-manga-surface-elevated border-border/50 hover:bg-manga-surface transition-colors cursor-pointer" onClick={() => handleChapterClick(chapter.id)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-manga-text-primary">
                        #{chapter.number}
                      </div>
                      <div>
                        <h3 className="font-medium text-manga-text-primary">{chapter.title}</h3>
                        <p className="text-sm text-manga-text-secondary">{chapter.releaseDate} • {chapter.pages} páginas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {chapter.isRead && (
                        <Badge variant="secondary" className="bg-manga-primary/20 text-manga-primary">
                          Lido
                        </Badge>
                      )}
                      <Button size="sm" variant="manga-ghost">
                        Ler
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="border-border/50" />

        {/* Comments Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="h-6 w-6 text-manga-primary" />
            <h2 className="text-2xl font-bold text-manga-text-primary">
              Comentários ({comments.length})
            </h2>
          </div>

          {/* Add Comment */}
          <Card className="bg-manga-surface-elevated border-border/50 mb-6">
            <CardContent className="p-4">
              <div className="space-y-4">
                <Textarea
                  placeholder="Escreva seu comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-manga-surface border-border/50 focus:border-manga-primary"
                  rows={3}
                />
                <div className="flex items-center space-x-2">
                  <CheckboxUI 
                    id="spoiler" 
                    checked={isSpoilerComment}
                    onCheckedChange={(checked) => setIsSpoilerComment(checked as boolean)}
                  />
                  <label htmlFor="spoiler" className="text-sm text-manga-text-secondary cursor-pointer">
                    Marcar como spoiler
                  </label>
                </div>
                <Button 
                  onClick={handleCommentSubmit}
                  disabled={!newComment.trim()}
                  className="bg-manga-primary hover:bg-manga-primary/90"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Comentário
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                id={comment.id}
                user={comment.user}
                userAvatar={comment.userAvatar}
                content={comment.content}
                date={comment.date}
                likes={comment.likes}
                isSpoiler={comment.isSpoiler}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MangaDetails;