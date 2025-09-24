import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ReadingProgress {
  mangaId: string;
  mangaTitle: string;
  mangaCoverUrl: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  currentPage: number;
  totalPages: number;
  isCompleted: boolean;
  lastReadAt: string;
  progressPercentage: number;
}

export const useReadingProgress = () => {
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProgress = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_reading_progress', {
        p_user_id: user.id
      });

      if (error) throw error;

      const transformedProgress: ReadingProgress[] = data?.map((item: any) => ({
        mangaId: item.manga_id,
        mangaTitle: item.manga_title,
        mangaCoverUrl: item.manga_cover_url,
        chapterId: item.chapter_id,
        chapterNumber: item.chapter_number,
        chapterTitle: item.chapter_title,
        currentPage: item.current_page,
        totalPages: item.total_pages,
        isCompleted: item.is_completed,
        lastReadAt: item.last_read_at,
        progressPercentage: item.progress_percentage,
      })) || [];

      setProgress(transformedProgress);
    } catch (error: any) {
      console.error('Error fetching reading progress:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o progresso de leitura.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgress = async (
    mangaId: string,
    chapterId: string,
    currentPage: number = 1,
    isCompleted: boolean = false
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('update_reading_progress', {
        p_user_id: user.id,
        p_manga_id: mangaId,
        p_chapter_id: chapterId,
        p_current_page: currentPage,
        p_is_completed: isCompleted
      });

      if (error) throw error;

      // Refresh progress data
      await fetchProgress();
    } catch (error: any) {
      console.error('Error updating reading progress:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o progresso.",
        variant: "destructive"
      });
    }
  };

  const getLastReadChapter = (mangaId: string): ReadingProgress | null => {
    return progress.find(p => p.mangaId === mangaId) || null;
  };

  const getProgressPercentage = (mangaId: string): number => {
    const mangaProgress = progress.filter(p => p.mangaId === mangaId);
    if (mangaProgress.length === 0) return 0;

    const completed = mangaProgress.filter(p => p.isCompleted).length;
    return Math.round((completed / mangaProgress.length) * 100);
  };

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  return {
    progress,
    isLoading,
    updateProgress,
    fetchProgress,
    getLastReadChapter,
    getProgressPercentage,
  };
};