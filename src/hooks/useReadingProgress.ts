import { useState, useEffect, useCallback } from 'react';
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

  const fetchProgress = useCallback(async () => {
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
  }, [user, toast]);

  const updateProgress = useCallback(async (
    mangaId: string,
    chapterId: string,
    currentPage: number = 1,
    isCompleted: boolean = false
  ) => {
    if (!user) return;

    try {
      // Insert directly into reading_progress table instead of using RPC
      const { error } = await supabase
        .from('reading_progress')
        .upsert({
          user_id: user.id,
          manga_id: mangaId,
          chapter_id: chapterId,
          current_page: currentPage,
          is_completed: isCompleted,
          last_read_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,manga_id'
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
  }, [user, fetchProgress, toast]);

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
  }, [user, fetchProgress]);

  return {
    progress,
    isLoading,
    updateProgress,
    fetchProgress,
    getLastReadChapter,
    getProgressPercentage,
  };
};